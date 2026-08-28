import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import './index.css'

import { Layout } from './components/ui/Layout'
import { OrganizationList } from './features/organization/OrganizationList'
import { EmployeeDirectory } from './features/employees/EmployeeDirectory'
import { EmployeeProfile } from './features/employees/EmployeeProfile'
import { PendingApprovals } from './features/workflow/PendingApprovals'
import { LeaveDashboard } from './features/leave/LeaveDashboard'
import { AttendanceDashboard } from './features/attendance/AttendanceDashboard'
import { PayrollDashboard } from './features/payroll/PayrollDashboard'
import { RecruitmentDashboard } from './features/recruitment/RecruitmentDashboard'
import { EmployeeServices } from './features/lifecycle/EmployeeServices'
import { MainDashboard } from './features/dashboard/MainDashboard'

// --- ROUTER SETUP ---
const rootRoute = createRootRoute({
  component: Layout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MainDashboard,
})

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inbox',
  component: PendingApprovals,
})

const leaveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leave',
  component: LeaveDashboard,
})

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attendance',
  component: AttendanceDashboard,
})

const payrollRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payroll',
  component: PayrollDashboard,
})

const recruitmentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recruitment',
  component: RecruitmentDashboard,
})

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: EmployeeServices,
})

const orgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organization',
  component: OrganizationList,
})

const empRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees',
  component: EmployeeDirectory,
})

const empProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employees/$employeeId',
  component: () => {
    const { employeeId } = empProfileRoute.useParams()
    return <EmployeeProfile employeeId={employeeId} />
  },
})

const routeTree = rootRoute.addChildren([indexRoute, inboxRoute, attendanceRoute, leaveRoute, payrollRoute, recruitmentRoute, servicesRoute, orgRoute, empRoute, empProfileRoute])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// --- QUERY CLIENT SETUP ---
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// --- RENDER ---
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
  )
}
