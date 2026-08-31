// router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import MainLayout from "@/layouts/MainLayout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/loginpage.vue"),
      meta: { requiresAuth: false, title: "Login" },
    },
    {
      path: "/",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/dashboard/Dashboard.vue"),
          meta: {
            title: "Dashboard",
            roles: [
              "admin",
              "hr",
              "finance",
              "employee",
              "attendance",
              "storekeeper",
              "store_it",
              "checker",
              "nebret",
               "formulation_manager",
               "production_order",
            ],
          },
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/employee/profile.vue"),
          meta: {
            title: "My Profile",
            roles: [
              "admin",
              "hr",
              "finance",
              "employee",
              "attendance",
              "storekeeper",
              "store_it",
              "checker",
            ],
          },
        },
        {
          path: "employees",
          name: "employees",
          component: () => import("@/views/employee/employees.vue"),
          meta: {
            title: "Employees Management",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },








  {
          path: "dashboard/hiring-details",
          name: "hiring-details",
          component: () => import("@/views/dashboard/components/HrDashboardPages/HiringDetailsPage.vue"),
          meta: {
            title: "Hiring Details  ",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },

  {
          path: "dashboard/department-distribution",
          name: "department-distribution",
          component: () => import("@/views/dashboard/components/HrDashboardPages/DepartmentDistributionPage.vue"),
          meta: {
            title: "Department Distribution  ",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
         {
          path: "dashboard/salary-distribution",
          name: "salary-distribution",
          component: () => import("@/views/dashboard/components/HrDashboardPages/SalaryDistributionPage.vue"),
          meta: {
            title: "Salary Distribution ",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
  {
          path: "dashboard/employment-distribution",
          name: "employment-distribution",
          component: () => import("@/views/dashboard/components/HrDashboardPages/EmploymentTypePage.vue"),
          meta: {
            title: " Employment Distribution ",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
 {
          path: "dashboard/document-compliance",
          name: "document-compliance",
          component: () => import("@/views/dashboard/components/HrDashboardPages/DocumentCompliancePage.vue"),
          meta: {
            title: "Document Compliance ",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
         {
             path: '/dashboard/guarantee-age-details',
          name: "guarantee-age-details",
          component: () => import("@/views/dashboard/components/HrDashboardPages/GuaranteeAgeDetails.vue"),
          meta: {
            title: "Guarantee Age Details ",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },







        {
          path: "fleet-management",
          name: "FleetManagement",
          component: () => import("@/views/fuelManagement/FleetManagement.vue"),
          meta: {
            title: "Fleet Management",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        























































        {
          path: "employees/create",
          name: "employee-create",
          component: () => import("@/views/employee/EmployeeCreate.vue"),
          meta: {
            title: "Create Employee",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "employees/:id",
          name: "employee-detail",
          component: () => import("@/views/employee/EmployeeDetail.vue"),
          meta: {
            title: "Employee Details",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },

        {
          path: "employees/:id/edit",
          name: "employee-edit",
          component: () => import("@/views/employee/EmployeeEdit.vue"),
          meta: {
            title: "Edit Employee",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters",
          name: "DocumentsLetters",
          component: () => import("@/views/employee/DocumentsLetters.vue"),
          meta: {
            title: "Documents & Letters",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },


        {
          path: "documents-letters/type1",
          name: "type1-standard",
          component: () => import("@/views/employee/letters/Type1Standard.vue"),
          meta: {
            title: "Standard Guarantee Letter",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters/type2",
          name: "type2-verification",
          component: () =>
            import("@/views/employee/letters/Type2Verification.vue"),
          meta: {
            title: "Employee Verification Letter",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters/type3",
          name: "type3-reverification",
          component: () =>
            import("@/views/employee/letters/Type3Reverification.vue"),
          meta: {
            title: "Guarantee Re-verification Letter",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters/type4",
          name: "type4-police",
          component: () => import("@/views/employee/letters/Type4Police.vue"),
          meta: {
            title: "Police Station Guarantee Letter",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters/type5",
          name: "type5-police-re",
          component: () => import("@/views/employee/letters/Type5PoliceRe.vue"),
          meta: {
            title: "Police Re-verification Letter",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters/type6",
          name: "type6-employment",
          component: () =>
            import("@/views/employee/letters/Type6Employment.vue"),
          meta: {
            title: "Employment Letter",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "documents-letters/type7",
          name: "type7-guarantee-form",
          component: () =>
            import("@/views/employee/letters/Type7EmployeeBiography.vue"),
          meta: {
            title: "Guarantee Form",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },

        {
          path: "users",
          name: "users",
          component: () => import("@/views/users/users.vue"),
          meta: {
            title: "Users Management",
            roles: ["admin", "hr", "finance", "employee", "attendance","checker"],
          },
        },

        {
          path: "attendance",
          name: "attendance",
          component: () => import("@/views/attendance/attendance.vue"),
          meta: {
            title: "HR attendance",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "Asset-Management",
          name: "Asset-Management",
          component: () =>
            import("@/views/AssetManagement/AssetManagement.vue"),
          meta: {
            title: "Asset Management",
            roles: [
              "admin",
              "hr",
              "finance",
              "employee",
              "attendance",
              "nebret",
            ],
          },
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("@/views/settings/settings.vue"),
          meta: {
            title: "HR settings",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "leaves",
          name: "leaves",
          component: () => import("@/views/leaveRequest/leaves.vue"),
          meta: {
            title: "Leaves",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "payroll",
          name: "payroll",
          component: () => import("@/views/payroll/payroll.vue"),
          meta: {
            title: "Payroll Management",
            roles: ["admin", "finance", "hr", "employee", "attendance"],
          },
        },

        {
          path: "notifications",
          name: "notifications",
          component: () =>
            import("@/views/storemanagement/notifications/Notifications.vue"),
          meta: {
            title: "Notifications",
            roles: ["admin", "storekeeper", "store_it", "checker", "employee" ,"nebret"],
          },
        },
        
{
  path: "pending-request", 
  name: "pending-request",
  component: () =>
    import("@/views/storemanagement/notifications/NotificationManagement.vue"),
  meta: {
    title: "pending-request",
    roles: ["admin", "storekeeper", "store_it", "checker", "employee", "nebret", "cost"],
  },
},

        
{
  path: "productions",  
  name: "productions",
  component: () =>
    import("@/views/storemanagement/production/productions.vue"),
  meta: {
    title: "productions",
    roles: ["admin", "storekeeper", "store_it", "checker", "employee", "nebret", "cost","formulation_manager"],
  },
},
{
  path: "formulation",  
  name: "formulation",
  component: () =>
    import("@/views/storemanagement/formulations/formulation.vue"),
  meta: {
    title: "formulation",
    roles: ["admin", "storekeeper", "store_it", "checker", "employee", "nebret", "cost","formulation_manager"],
  },
},
        {
          path: "/cost-calculation-rules",
          name: "CostCalculationRules",
          component: () =>
            import("@/views/storemanagement/ItemCost/CostCalculationRules.vue"),
          meta: {
            title: "Cost Calculation Rules",
            requiresAuth: true,
          },
        },

        {
          path: "approved-leaves-list",
          name: "approved-leaves-list",
          component: () =>
            import("@/views/leaveRequest/approvedLeavesList.vue"),
          meta: {
            title: "Approved Leave Requests",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "leave-detail/:id",
          name: "leave-detail",
          component: () => import("@/views/leaveRequest/leaveDetail.vue"),
          meta: {
            title: "Leave Detail",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        // ============================================================
        // STORE INVENTORY ROUTES
        // ============================================================
        {
          path: "inventory",
          name: "inventory",
          component: () =>
            import("@/views/storemanagement/inventory/inventory.vue"),
          meta: {
            title: "Inventory Management",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },
        {
          path: "item-cost",
          name: "item-cost",
          component: () =>
            import("@/views/storemanagement/ItemCost/ItemCost.vue"),
          meta: {
            title: "cost Management",
            roles: ["admin", "storekeeper", "store_it", "checker", "cost"],
          },
        },

        {
          path: "group-management",
          name: "group-management",
          component: () =>
            import("@/views/storemanagement/storeAndGroups/groupManagement.vue"),
          meta: {
            title: "group Management",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },

        {
          path: "store-management",
          name: "store-management",
          component: () =>
            import("@/views/storemanagement/storeAndGroups/storeManagemet.vue"),
          meta: {
            title: "store Management",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },

        {
          path: "user-management",
          name: "user-management",
          component: () =>
            import("@/views/storemanagement/storeAndGroups/userManagment.vue"),
          meta: {
            title: "user Management",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },

        {
          path: "audit",
          name: "audit",
          component: () => import("@/views/storemanagement/audit/audit.vue"),
          meta: {
            title: "audit ",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },

        {
          path: "store-to-store",
          name: "store-to-store",
          component: () =>
            import("@/views/storemanagement/storeAndGroups/storeTostoreRelationship.vue"),
          meta: {
            title: "store to store relationship ",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },

        {
          path: "store-balance",
          name: "store-balance",
          component: () =>
            import("@/views/storemanagement/storebalance/storebalance.vue"),
          meta: {
            title: "general store balance ",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },
        {
          path: "store-balance/print",
          name: "print-store-balance",
          component: () =>
            import("@/views/storemanagement/storebalance/print-balance.vue"),
          meta: {
            title: "Print Store Balance",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },
         {
          path: "store-balance-corrections",
          name: "store-balance-corrections",
          component: () =>
            import("@/views/storemanagement/storebalance/BalanceCorrection.vue"),
          meta: {
            title: "Print Store Balance",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },

        {
          path: "store-transaction",
          name: "store-transaction",
          component: () =>
            import("@/views/storemanagement/storetransaction/storetransaction.vue"),
          meta: {
            title: "general store transaction ",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },
          {
          path: "finished-goods",
          name: "finished-goods",
          component: () =>
            import("@/views/storemanagement/finishedgood/finishedGood.vue"),
          meta: {
            title: "finished goods ",
            roles: ["admin", "storekeeper", "store_it", "checker","formulation_manager"],
          },
        },
   {
          path: "converted-balance",
          name: "converted-balance",
          component: () =>
            import("@/views/storemanagement/storebalance/convertedBalance.vue"),
          meta: {
            title: "converted balance ",
            roles: ["admin", "storekeeper", "store_it", "checker"],
          },
        },
        

        {
          path: "store-transaction/print",
          name: "print-transactions",
          component: () =>
            import("@/views/storemanagement/storetransaction/print-transactions.vue"),
          meta: {
            title: "Print Transactions",
            roles: ["admin", "storekeeper", "store_it", "checker"],
             hideLayout: true  // ✅ ADD THIS
          },
        },

        {
          path: "item-requests",
          name: "item-requests",
          component: () =>
            import("@/views/storemanagement/itemRequests/itemRequests.vue"),
          meta: {
            title: "item requests ",
            roles: ["admin", "storekeeper", "store_it", "checker", "employee", "nebret","cost","formulation_manager","production_order"],
          },
        },

            {
          path: "orders",
          name: "orders",
          component: () =>
            import("@/views/storemanagement/orders/orders.vue"),
          meta: {
            title: "item requests ",
            roles: ["admin", "storekeeper", "store_it", "checker", "employee", "nebret","cost","formulation_manager","production_order"],
          },
        },

           {
          path: "order-notifications",
          name: "order-notifications",
          component: () =>
            import("@/views/storemanagement/orders/OrderNotifications.vue"),
          meta: {
            title: "order-notifications ",
            roles: ["admin", "storekeeper", "store_it", "checker", "employee", "nebret","cost","formulation_manager","production_order"],
          },
        },

        {
          path: "print-requests",
          name: "print-requests",
          component: () =>
            import("@/views/storemanagement/itemRequests/printrequests.vue"),
          meta: {
            title: "print requests ",
            roles: ["admin", "storekeeper", "store_it", "checker", "employee"],
          },
        },

        {
          path: "",
          redirect: "/dashboard",
        },
      ],
    },
  ],
});

// ============================================================
// NAVIGATION GUARD - UPDATED FOR STORE ROLE
// ============================================================
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole || "employee"; // Default fallback

  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
    return;
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (to.path === "/login" && isAuthenticated) {
    next("/dashboard");
    return;
  }

  // If not authenticated, allow access
  if (!isAuthenticated) {
    next();
    return;
  }

  // ============================================================
  // OTHER ROLES - Check role-based access
  // ============================================================
  if (
    to.meta.roles &&
    Array.isArray(to.meta.roles) &&
    to.meta.roles.length > 0
  ) {
    if (!to.meta.roles.includes(userRole)) {
      if (to.path === "/dashboard") {
        next();
        return;
      }
      next("/dashboard");
      return;
    }
  }

  next();
});

export default router;
