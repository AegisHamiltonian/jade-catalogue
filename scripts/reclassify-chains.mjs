// Explicit, shop-confirmed measurements only; never infer bead size from a title.
export async function reclassifyChains(db,items) {
  if(!Array.isArray(items)||!items.length||new Set(items.map(i=>i.sku)).size!==items.length||items.some(i=>!(/^[a-zA-Z0-9._-]{1,32}$/.test(i.sku))||!Number.isFinite(i.diameter)||i.diameter<=0||i.diameter>=1000))throw new Error('Explicit SKU and bead diameter list required');
  const checksum="md5((to_jsonb(p)-'category'-'ni_tay'-'bead_diameter_mm'-'updated_at')::text)";
  const results=[];
  await db.query('begin');
  try {
    for(const item of items) {
      const before=(await db.query(`select category,ni_tay,bead_diameter_mm,${checksum} as preserved from public.products p where sku=$1 for update`,[item.sku])).rows;
      if(before.length!==1)throw new Error('Confirmed SKU not found: '+item.sku);
      const row=before[0];
      if(row.category==='vong_chuoi'&&row.ni_tay==null&&Number(row.bead_diameter_mm)===item.diameter){results.push({...item,alreadyConverted:true});continue;}
      if(row.category!=='vong'||Number(row.ni_tay)!==item.diameter||row.bead_diameter_mm!=null)throw new Error('Measurement changed; inspect before reclassifying '+item.sku);
      const after=(await db.query(`update public.products p set category='vong_chuoi',bead_diameter_mm=ni_tay,ni_tay=null where sku=$1 returning ${checksum} as preserved`,[item.sku])).rows[0];
      if(after.preserved!==row.preserved)throw new Error('Unrelated product fields changed');
      results.push({...item,alreadyConverted:false});
    }
    await db.query('commit');
    return {reclassified:true,unrelatedFieldsPreserved:true,items:results};
  }catch(error){await db.query('rollback');throw error;}
}
