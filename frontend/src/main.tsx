import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import './index.css'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './features/auth/Login'
import { ForgotPassword } from './features/auth/ForgotPassword'
import { ResetPassword } from './features/auth/ResetPassword'

import { Layout } from './components/ui/Layout'
import { OrganizationList } from './features/organization/OrganizationList'
import { Designations } from './features/organization/Designations'
import { EmployeeDirectory } from './features/employees/EmployeeDirectory'
import { EmployeeProfile } from './features/employees/EmployeeProfile'
import { ProbationDashboard } from './features/lifecycle/ProbationDashboard'
import { PendingApprovals } from './features/workflow/PendingApprovals'
import { HRTaskCenter } from './features/workflow/HRTaskCenter'
import { LeaveDashboard } from './features/leave/LeaveDashboard'
import { AttendanceDashboard } from './features/attendance/AttendanceDashboard'
import { PayrollDashboard } from './features/payroll/PayrollDashboard'
import { RecruitmentDashboard } from './features/recruitment/RecruitmentDashboard'
import { EmployeeServices } from './features/lifecycle/EmployeeServices'
import { MainDashboard } from './features/dashboard/MainDashboard'

import { Users } from './features/admin/Users'
import { DocumentTypes } from './features/admin/DocumentTypes'
import { OnboardingTemplates } from './features/admin/OnboardingTemplates'
import { OnboardingDashboard } from './features/employees/onboarding/OnboardingDashboard'
import { OnboardingInstance } from './features/employees/onboarding/OnboardingInstance'
import { BulkImportWizard } from './features/import/BulkImportWizard'
import { ImportHistory } from './features/import/ImportHistory'
import { ExitDashboard } from './features/lifecycle/ExitDashboard'
import { MyAttendance } from './features/attendance/MyAttendance'
import { DataQualityCenter } from './features/reports/DataQualityCenter'
import { ReportsDashboard } from './features/reports/ReportsDashboard'

// --- ROUTER SETUP ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth() as any
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/login' })
    }
  }, [user, isLoading, navigate])

  if (isLoading || !user) return null
  return <>{children}</>
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPassword,
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) ?? '',
  }),
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: () => (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: MainDashboard,
})

const inboxRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inbox',
  component: PendingApprovals,
})

const leaveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/leave',
  component: LeaveDashboard,
})

const attendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/attendance',
  component: AttendanceDashboard,
})

const payrollRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/payroll',
  component: PayrollDashboard,
})

const recruitmentRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/recruitment',
  component: RecruitmentDashboard,
})

const servicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/services',
  component: EmployeeServices,
})

const orgRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/organization',
  component: OrganizationList,
})

const designationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/designations',
  component: Designations,
})

const empRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/employees',
  component: EmployeeDirectory,
})

const empProfileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/employees/$employeeId',
  component: () => {
    const { employeeId } = empProfileRoute.useParams()
    return <EmployeeProfile employeeId={employeeId} />
  },
})

const probationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/probation',
  component: ProbationDashboard,
})

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/users',
  component: Users,
})

const documentTypesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/document-types',
  component: DocumentTypes,
})

const onboardingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/onboarding-templates',
  component: OnboardingTemplates,
})

const onboardingDashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/onboarding',
  component: OnboardingDashboard,
})

const onboardingInstanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/onboarding/$instanceId',
  component: OnboardingInstance,
})

const importRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/import',
  component: BulkImportWizard,
})

const importHistoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/import/history',
  component: ImportHistory,
})

const exitRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/offboarding',
  component: ExitDashboard,
})


const myAttendanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/my/attendance',
  component: MyAttendance,
})

const hrTasksRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/hr-tasks',
  component: HRTaskCenter,
})

const dataQualityRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/data-quality',
  component: DataQualityCenter,
})

const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/reports',
  component: ReportsDashboard,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  appRoute.addChildren([
    indexRoute, 
    inboxRoute, 
    hrTasksRoute,
    dataQualityRoute,
    reportsRoute,
    attendanceRoute, 
    leaveRoute, 
    payrollRoute, 
    recruitmentRoute, 
    servicesRoute, 
    orgRoute, 
    designationsRoute,
    empRoute, 
    empProfileRoute,
    probationRoute,
    usersRoute,
    documentTypesRoute,
    onboardingRoute,
    onboardingDashboardRoute,
    onboardingInstanceRoute,
    importRoute,
    importHistoryRoute,
    exitRoute,
    myAttendanceRoute
  ])
])

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
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Add auth token to all fetch requests
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const [, config] = args
  const token = localStorage.getItem('hrms_token') || localStorage.getItem('token')
  if (token) {
    if (config) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    } else {
      args[1] = { headers: { 'Authorization': `Bearer ${token}` } }
    }
  }
  return originalFetch(...args)
}

// --- RENDER ---
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} InnerWrap={({ children }) => <AuthProvider>{children}</AuthProvider>} />
    </QueryClientProvider>
  </React.StrictMode>
)
