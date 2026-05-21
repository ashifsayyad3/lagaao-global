export enum Role {
  CUSTOMER   = 'customer',
  VENDOR     = 'vendor',
  ADMIN      = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.CUSTOMER]:    1,
  [Role.VENDOR]:      2,
  [Role.ADMIN]:       3,
  [Role.SUPER_ADMIN]: 4,
};
