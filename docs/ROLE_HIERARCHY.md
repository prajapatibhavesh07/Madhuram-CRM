# Dynamic Role Hierarchy & Reporting Flow

Madhuram-CRM supports dynamic role relationships. Administrators can configure which role reports to which other role directly from the **Roles & Permissions** settings page. The backend and frontend automatically adjust dropdowns, isolation scopes, and data traversal dynamically.

---

## 1. Database Schema (`Role` Model)

The `Role` collection stores a `reportsTo` field pointing to the name of its parent role:

```javascript
reportsTo: {
    type: String,
    default: null
}
```

### Seeding Defaults
By default, the system seeds the following built-in role hierarchy:
- `Normal User` reports to `Recruiter`
- `Recruiter` reports to `Team Lead`
- `Team Lead` reports to `Manager`
- `Manager` reports to `HR`
- `HR` reports to `Admin`
- `Admin` / `Super Admin` report to `null`

---

## 2. Dynamic Hierarchy UI

### Role Configuration
When creating or editing any role in the **Roles & Permissions** settings panel, users can configure the `reportsTo` relationship via a dropdown listing all other roles in the system.

### User Assignment
In **User Registration & Editing**, the form automatically detects the selected role's `reportsTo` target:
- It dynamically fetches all active users possessing the parent role name.
- It displays a dropdown label like `Assign [Parent Role]` (e.g., "Assign Operation Manager", "Assign Team Lead").
- It maps the selection to `teamLeadId` if reporting to a `'Team Lead'`, or to `managerId` for all other roles.

---

## 3. Data Isolation & Hierarchy Traversal

The backend uses a recursive function `getSubordinateIds(userId)` in `roleMiddleware.js` to calculate recursive subordinates:

```javascript
const getSubordinateIds = async (userId) => {
    // Recursively finds all users reporting directly or indirectly to the target userId
}
```

This traversal translates directly into:
1. **API Authorization**: Checking nested rights of managers over recruiters' resources.
2. **Dashboard Isolation**: Managers, Team Leads, and custom roles see nested aggregation of statistics from themselves and all their recursive subordinates.
3. **Employee Pulse Widget**: Admins see all non-user accounts, while subordinates only see pulse metrics for members under their branch.
