export default function GetAdminLevel(bound) {
  const adminLevel = (bound.match(RegExp('\\.', 'g')) || []).length;
  return adminLevel;
}
