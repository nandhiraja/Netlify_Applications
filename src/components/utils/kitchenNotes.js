/**
 * Kitchen tags for one cart line on KOTs: parcel marker (mixed orders), free-text options and the
 * guest's note. Stored on item.selectedCustomizations by the item sheet.
 */
export function kitchenTags(item) {
  const c = item?.selectedCustomizations || {};
  const tags = [];
  if (c.parcel) tags.push('[PARCEL]');
  if (Array.isArray(c.options) && c.options.length > 0) tags.push(`[${c.options.join(', ')}]`);
  if (c.note) tags.push(`[Note: ${c.note}]`);
  return tags;
}
