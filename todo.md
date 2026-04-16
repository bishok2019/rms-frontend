# API Integration Status

This document outlines the current state of API integrations in the Restaurant POS system.

## Completed Integrations

### Authentication (auth-app)
- ✅ Login (`/api/v1/auth-app/login`)
- ✅ Registration (`/api/v1/auth-app/user-sign-up`)
- ✅ Forgot Password (`/api/v1/auth-app/forget-password`)
- ✅ Reset Password (`/api/v1/auth-app/change-password-otp`)
- ✅ Get User Profile (`/api/v1/auth-app/get-user-profile`)
- ✅ Update Profile (`/api/v1/auth-app/update-profile`)
- ✅ Users List (`/api/v1/auth-app/users/list`)
- ✅ Create User (`/api/v1/auth-app/users/create`)
- ✅ Update User (`/api/v1/auth-app/users/update/{id}`)
- ✅ Permission Categories List (`/api/v1/auth-app/permissions/permission-category/list`)
- ✅ Permissions List (`/api/v1/auth-app/permissions/permission/list`)

### API Logs (api-logs-app)
- ✅ List API Logs (`/api/v1/api-logs-app/list`)
- ✅ Retrieve API Log (`/api/v1/api-logs-app/retrieve/{id}`)

### Core App (core-app)
- ✅ Dining Tables: Create (`/api/v1/core-app/dining_table/create`), List (`/api/v1/core-app/dining_table/list`), Update (`/api/v1/core-app/dining_table/update/{id}`)
- ✅ Employees: Create (`/api/v1/core-app/employee/create`), List (`/api/v1/core-app/employee/list`), Update (`/api/v1/core-app/employee/update/{id}`)
- ✅ Kitchen Categories: Create (`/api/v1/core-app/kitchen/category/create`), List (`/api/v1/core-app/kitchen/category/list`), Update (`/api/v1/core-app/kitchen/category/update/{id}`)
- ✅ Kitchens: Create (`/api/v1/core-app/kitchen/create`), List (`/api/v1/core-app/kitchen/list`), Update (`/api/v1/core-app/kitchen/update/{id}`)
- ✅ Menu Categories: Create (`/api/v1/core-app/menu/create`), List (`/api/v1/core-app/menu/list`), Update (`/api/v1/core-app/menu/update/{id}`)
- ✅ Menu Items: Create (`/api/v1/core-app/menu/items/create`), List (`/api/v1/core-app/menu/items/list`), Update (`/api/v1/core-app/menu/items/update/{id}`)
- ✅ Orders: Create (`/api/v1/core-app/orders/create`), List (`/api/v1/core-app/orders/list`), Retrieve (`/api/v1/core-app/orders/retrieve/{id}`), Update (`/api/v1/core-app/orders/update/{id}`)
- ✅ Order Items: List (`/api/v1/core-app/order_items/list`)
- ✅ Sections: Create (`/api/v1/core-app/section/create`), List (`/api/v1/core-app/section/list`), Update (`/api/v1/core-app/section/update/{id}`)

### Location (location-app)
- ❌ Provinces List (`/api/v1/location-app/provinces/list`) - API functions defined but not integrated into UI
- ❌ Districts List (`/api/v1/location-app/districts/list`) - API functions defined but not integrated into UI
- ❌ Palikas List (`/api/v1/location-app/palika/list`) - API functions defined but not integrated into UI
- ❌ Wards List (`/api/v1/location-app/wards/list`) - API functions defined but not integrated into UI

## Remaining Integrations

### Authentication (auth-app)
- ❌ Contact Us: Create (`/api/v1/auth-app/contact-us/create`), List (`/api/v1/auth-app/contact-us/list`)
- ❌ Get All Profile List (`/api/v1/auth-app/get-all-profile-list`)
- ❌ Logout (`/api/v1/auth-app/logout`) - Note: Currently handled client-side
- ❌ Refresh Token (`/api/v1/auth-app/refresh-token`)
- ❌ Roles: Create (`/api/v1/auth-app/role/create`), List (`/api/v1/auth-app/role/list`), Retrieve (`/api/v1/auth-app/role/retrieve/{id}`), Update (`/api/v1/auth-app/role/update/{id}`), Dropdown (`/api/v1/auth-app/role/list/dropdown`)
- ❌ Permissions Dropdown (`/api/v1/auth-app/permissions/permission/list/dropdown`)
- ❌ Users: Retrieve (`/api/v1/auth-app/users/retrieve/{id}`), Change Password (`/api/v1/auth-app/users/change-password`), Update Password (`/api/v1/auth-app/users/update-password/{id}`)

### Core App (core-app)
- ❌ Dining Tables: Retrieve (`/api/v1/core-app/dining_table/retrieve/{id}`)
- ❌ Employees: Retrieve (`/api/v1/core-app/employee/retrieve/{id}`)
- ❌ Kitchen Categories: Retrieve (`/api/v1/core-app/kitchen/category/retrieve/{id}`)
- ❌ Kitchens: Retrieve (`/api/v1/core-app/kitchen/retrieve/{id}`)
- ❌ Menu Categories: Retrieve (`/api/v1/core-app/menu/retrieve/{id}`)
- ❌ Menu Items: Retrieve (`/api/v1/core-app/menu/items/retrieve/{id}`)
- ❌ Order Items: Create (`/api/v1/core-app/order_items/create`), Retrieve (`/api/v1/core-app/order_items/retrieve/{id}`), Update (`/api/v1/core-app/order_items/update/{id}`)

### Customer App (customer-app)
- ❌ Customers: Create (`/api/v1/customer-app/customer/create`), List (`/api/v1/customer-app/customer/list`), Retrieve (`/api/v1/customer-app/customer/retrieve/{id}`), Update (`/api/v1/customer-app/customer/update/{id}`)

## Notes
- Some retrieve endpoints may not be immediately needed if list views provide sufficient data
- UI components may exist for some integrated APIs but could require additional features or refinements
- Authentication state persistence was recently renamed from "shikhar-pos" to "bishok-pos"