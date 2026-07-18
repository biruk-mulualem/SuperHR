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
            roles: ["admin", "hr", "finance", "employee", "attendance", "storekeeper","store_it","checker"],
          },
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/employee/Profile.vue"),
          meta: {
            title: "My Profile",
            roles: ["admin", "hr", "finance", "employee", "attendance", "storekeeper","store_it","checker"],
          },
        },
        {
          path: "employees",
          name: "employees",
          component: () => import("@/views/employee/Employees.vue"),
          meta: { title: "Employees Management", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "employees/create",
          name: "employee-create",
          component: () => import("@/views/employee/EmployeeCreate.vue"),
          meta: { title: "Create Employee", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "employees/:id",
          name: "employee-detail",
          component: () => import("@/views/employee/EmployeeDetail.vue"),
          meta: { title: "Employee Details", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "employees/:id/edit",
          name: "employee-edit",
          component: () => import("@/views/employee/EmployeeEdit.vue"),
          meta: { title: "Edit Employee", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "documents-letters",
          name: "DocumentsLetters",
          component: () => import("@/views/employee/DocumentsLetters.vue"),
          meta: { title: "Documents & Letters", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/views/users/Users.vue"),
          meta: { title: "Users Management", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "analytics",
          name: "analytics",
          component: () => import("@/views/analytics/Analytics.vue"),
          meta: { title: "HR Analytics", roles: ["admin", "hr", "finance", "employee", "attendance"] },
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
          path: "settings",
          name: "settings",
          component: () => import("@/views/settings/settings.vue"),
          meta: { title: "HR settings", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "leaves",
          name: "leaves",
          component: () => import("@/views/leaveRequest/leaves.vue"),
          meta: { title: "Leaves", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        {
          path: "payroll",
          name: "payroll",
          component: () => import("@/views/payroll/payroll.vue"),
          meta: { title: "Payroll Management", roles: ["admin", "finance", "hr", "employee", "attendance"] },
        },
        {
          path: "approved-leaves-list",
          name: "approved-leaves-list",
          component: () => import("@/views/leaveRequest/approvedLeavesList.vue"),
          meta: {
            title: "Approved Leave Requests",
            roles: ["admin", "hr", "finance", "employee", "attendance"],
          },
        },
        {
          path: "leave-detail/:id",
          name: "leave-detail",
          component: () => import("@/views/leaveRequest/leaveDetail.vue"),
          meta: { title: "Leave Detail", roles: ["admin", "hr", "finance", "employee", "attendance"] },
        },
        // ============================================================
        // STORE INVENTORY ROUTES
        // ============================================================
        {
          path: "inventory",
          name: "inventory",
          component: () => import("@/views/storemanagement/inventory/inventory.vue"),
          meta: { 
            title: "Inventory Management", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },
         {
          path: "item-cost",
          name: "item-cost",
          component: () => import("@/views/storemanagement/ItemCost/ItemCost.vue"),
          meta: { 
            title: "cost Management", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },

          {
          path: "group-management",
          name: "group-management",
          component: () => import("@/views/storemanagement/storeAndGroups/groupManagement.vue"),
          meta: { 
            title: "group Management", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },


          {
          path: "store-management",
          name: "store-management",
          component: () => import("@/views/storemanagement/storeAndGroups/storeManagemet.vue"),
          meta: { 
            title: "store Management", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },

          {
          path: "user-management",
          name: "user-management",
          component: () => import("@/views/storemanagement/storeAndGroups/userManagment.vue"),
          meta: { 
            title: "user Management", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },
       
          {
          path: "audit",
          name: "audit",
          component: () => import("@/views/storemanagement/audit/audit.vue"),
          meta: { 
            title: "audit ", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },

          {
          path: "store-to-store",
          name: "store-to-store",
          component: () => import("@/views/storemanagement/storeAndGroups/storeTostoreRelationship.vue"),
          meta: { 
            title: "store to store relationship ", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },

            {
          path: "store-balance",
          name: "store-balance",
          component: () => import("@/views/storemanagement/storebalance/storebalance.vue"),
          meta: { 
            title: "general store balance ", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },
         {
          path: "store-balance/print",
          name: "print-store-balance",
          component: () => import("@/views/storemanagement/storebalance/print-balance.vue"),
          meta: { 
            title: "Print Store Balance", 
            roles: ["admin", "storekeeper", "store_it", "checker"] 
          },
        },


              {
          path: "store-transaction",
          name: "store-transaction",
          component: () => import("@/views/storemanagement/storetransaction/storetransaction.vue"),
          meta: { 
            title: "general store transaction ", 
            roles: ["admin", "storekeeper","store_it","checker"] 
          },
        },

        {
  path: "store-transaction/print",
  name: "print-transactions",
  component: () => import("@/views/storemanagement/storetransaction/print-transactions.vue"),
  meta: { 
    title: "Print Transactions", 
    roles: ["admin", "storekeeper", "store_it", "checker"] 
  },
},

               {
          path: "item-requests",
          name: "item-requests",
          component: () => import("@/views/storemanagement/itemRequests/itemRequests.vue"),
          meta: { 
            title: "item requests ", 
            roles: ["admin", "storekeeper","store_it","checker","employee"] 
          },
        },

             {
          path: "print-requests",
          name: "print-requests",
          component: () => import("@/views/storemanagement/itemRequests/printrequests.vue"),
          meta: { 
            title: "print requests ", 
            roles: ["admin", "storekeeper","store_it","checker","employee"] 
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
  const userRole = authStore.userRole || 'employee'; // Default fallback

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
  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
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