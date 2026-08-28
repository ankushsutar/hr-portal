import { useState } from 'react'
import { Wallet, LogOut, Laptop, UserCheck, HelpCircle } from 'lucide-react'
import { ServiceRequestForm } from './ServiceRequestForm'
import { Card } from '../../components/ui/Card'

export const EmployeeServices = () => {
  const [activeRequestType, setActiveRequestType] = useState<string | null>(null)

  const services = [
    { id: 'ADVANCE', icon: Wallet, title: 'Salary Advance', description: 'Request a payroll advance for unexpected emergencies.' },
    { id: 'WFH', icon: Laptop, title: 'Work From Home', description: 'Request WFH days outside your regular monthly quota.' },
    { id: 'OD', icon: UserCheck, title: 'On Duty (OD)', description: 'Log official duties and client visits outside office premises.' },
    { id: 'RESIGN', icon: LogOut, title: 'Initiate Separation', description: 'Submit formal resignation notice and begin offboarding clearance.' },
    { id: 'HELP', icon: HelpCircle, title: 'HR Helpdesk', description: 'Raise general queries or request HR documentation assistance.' }
  ]

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div>
        <h1 className="text-[28px] font-bold text-slate-100 leading-tight tracking-tight">Employee Self-Service Desk</h1>
        <p className="text-xs font-mono text-slate-400 mt-1">SUBMIT SPECIAL REQUESTS & LIFECYCLE TICKET WORKFLOWS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(svc => {
          const Icon = svc.icon
          return (
            <Card 
              key={svc.id}
              onClick={() => setActiveRequestType(svc.id)}
              className="p-5 flex flex-col justify-between hover:border-blue-500/50 group"
            >
              <div>
                <div className="w-10 h-10 bg-blue-500/10 rounded border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-1">{svc.title}</h3>
                <p className="text-slate-400 text-xs font-mono leading-relaxed">{svc.description}</p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-end font-mono text-xs text-blue-400 group-hover:text-blue-300">
                Initiate Request &rarr;
              </div>
            </Card>
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
