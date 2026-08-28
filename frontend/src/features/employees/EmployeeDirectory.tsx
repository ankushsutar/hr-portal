import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Search, Plus, MoreHorizontal } from 'lucide-react'

const fetchEmployees = async () => {
  const res = await fetch('http://localhost:8080/api/v1/employees')
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export const EmployeeDirectory = () => {
  const { data, isLoading } = useQuery({ queryKey: ['employees'], queryFn: fetchEmployees })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and view all employee records.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Emp ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joining Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Loading employees...
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              data?.data?.map((emp: any) => (
                <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-gray-500">Engineering</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{emp.employee_id}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{emp.joining_date}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to="/employees/$employeeId"
                      params={{ employeeId: emp.id }}
                      className="text-indigo-600 hover:text-indigo-900 font-medium text-sm mr-4"
                    >
                      View Profile
                    </Link>
                    <button className="text-gray-400 hover:text-gray-700">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
