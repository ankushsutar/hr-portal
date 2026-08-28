import { useState } from 'react'
import { Wallet, LogOut, Laptop, UserCheck, HelpCircle } from 'lucide-react'
import { ServiceRequestForm } from './ServiceRequestForm'

export const EmployeeServices = () => {
  const [activeRequestType, setActiveRequestType] = useState<string | null>(null)

  const services = [
    { id: 'ADVANCE', icon: Wallet, title: 'Salary Advance', description: 'Request a payroll advance for emergencies.' },
    { id: 'WFH', icon: Laptop, title: 'Work From Home', description: 'Request WFH days outside your regular allocation.' },
    { id: 'OD', icon: UserCheck, title: 'On Duty (OD)', description: 'Log official duties outside the office premises.' },
    { id: 'RESIGN', icon: LogOut, title: 'Initiate Separation', description: 'Submit your resignation and begin offboarding.' },
    { id: 'HELP', icon: HelpCircle, title: 'HR Helpdesk', description: 'Raise a general query to the HR team.' }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Services</h2>
          <p className="text-gray-500 mt-1">Submit special requests or initiate lifecycle events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(svc => {
          const Icon = svc.icon
          return (
            <div 
              key={svc.id}
              onClick={() => setActiveRequestType(svc.id)}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{svc.title}</h3>
              <p className="text-sm text-gray-500 mt-2">{svc.description}</p>
            </div>
          )
        })}
      </div>

      {activeRequestType && (
        <ServiceRequestForm 
          type={activeRequestType} 
          onClose={() => setActiveRequestType(null)} 
        />
      )}
    </div>
  )
}
