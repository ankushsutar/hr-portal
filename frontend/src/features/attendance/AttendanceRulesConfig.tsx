import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '../../components/ui/Card'
import { ShieldCheck, Globe, MapPin, Cpu, Save, Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'

interface RulesData {
  id?: string
  rule_name: string
  web_clock_enabled: boolean
  ip_restriction_enabled: boolean
  geofence_enabled: boolean
  biometric_sync_enabled: boolean
  default_grace_period_minutes: number
  half_day_threshold_hours: number
}

interface IPItem {
  id: string
  ip_address: string
  description: string
  is_active: boolean
  created_at?: string
}

interface GeofenceItem {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at?: string
}

export const AttendanceRulesConfig = () => {
  const qc = useQueryClient()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // New IP form state
  const [newIP, setNewIP] = useState('')
  const [newIPDesc, setNewIPDesc] = useState('')

  // New Geofence form state
  const [fenceName, setFenceName] = useState('')
  const [fenceLat, setFenceLat] = useState('')
  const [fenceLon, setFenceLon] = useState('')
  const [fenceRadius, setFenceRadius] = useState('100')

  // Fetch global rules
  const { data: rulesRes } = useQuery({
    queryKey: ['attendance-rules'],
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/config/rules', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load rules')
      return res.json()
    }
  })

  // Fetch IP allowlist
  const { data: ipRes } = useQuery({
    queryKey: ['attendance-ip-allowlist'],
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/config/ip-allowlist', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load IP allowlist')
      return res.json()
    }
  })

  // Fetch Geofences
  const { data: geoRes } = useQuery({
    queryKey: ['attendance-geofences'],
    queryFn: async () => {
      const res = await fetch('/api/v1/attendance/config/geofences', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) throw new Error('Failed to load geofences')
      return res.json()
    }
  })

  const rules: RulesData = rulesRes?.data || {
    rule_name: 'GLOBAL_DEFAULT',
    web_clock_enabled: true,
    ip_restriction_enabled: false,
    geofence_enabled: false,
    biometric_sync_enabled: true,
    default_grace_period_minutes: 15,
    half_day_threshold_hours: 4.0
  }

  const [formRules, setFormRules] = useState<RulesData>(rules)

  // Sync form state when rules update
  if (rulesRes?.data && formRules.id !== rulesRes.data.id) {
    setFormRules(rulesRes.data)
  }

  // Update Rules Mutation
  const updateRulesMut = useMutation({
    mutationFn: async (payload: RulesData) => {
      const res = await fetch('/api/v1/attendance/config/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to update rules')
      return data
    },
    onSuccess: () => {
      setSuccessMsg('Attendance security policies updated successfully.')
      setErrorMsg(null)
      qc.invalidateQueries({ queryKey: ['attendance-rules'] })
    },
    onError: (err: any) => {
      setErrorMsg(err.message)
    }
  })

  // Add IP Mutation
  const addIPMut = useMutation({
    mutationFn: async ({ ip_address, description }: { ip_address: string, description: string }) => {
      const res = await fetch('/api/v1/attendance/config/ip-allowlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ip_address, description })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to add IP')
      return data
    },
    onSuccess: () => {
      setNewIP('')
      setNewIPDesc('')
      qc.invalidateQueries({ queryKey: ['attendance-ip-allowlist'] })
    }
  })

  // Delete IP Mutation
  const deleteIPMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/attendance/config/ip-allowlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-ip-allowlist'] })
    }
  })

  // Add Geofence Mutation
  const addFenceMut = useMutation({
    mutationFn: async (fence: { name: string, latitude: number, longitude: number, radius_meters: number }) => {
      const res = await fetch('/api/v1/attendance/config/geofences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(fence)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Failed to add geofence')
      return data
    },
    onSuccess: () => {
      setFenceName('')
      setFenceLat('')
      setFenceLon('')
      setFenceRadius('100')
      qc.invalidateQueries({ queryKey: ['attendance-geofences'] })
    }
  })

  // Trigger Biometric Sync
  const bioSyncMut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/attendance/biometric/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ device_id: 'ZKTECO-HQ-01', logs: [] })
      })
      return res.json()
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message)
    }
  })

  const ipList: IPItem[] = ipRes?.data || []
  const fenceList: GeofenceItem[] = geoRes?.data || []

  return (
    <div className="space-y-6 font-sans">
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-700">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-700">×</button>
        </div>
      )}

      {/* Global Rules Section */}
      <Card className="p-6 space-y-6 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <ShieldCheck size={18} className="theme-accent-text" />
              Central Security & Clocking Policies
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              Enforce organization-wide web punch constraints, IP boundaries, and geofence radii.
            </p>
          </div>
          <button
            onClick={() => updateRulesMut.mutate(formRules)}
            disabled={updateRulesMut.isPending}
            className="theme-accent-bg hover:opacity-90 text-white px-4 py-2 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Save size={14} /> Save Security Policies
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Web Clocking Toggle */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--text-main)]">Web Clocking</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">Allow portal browser punch</div>
            </div>
            <button
              onClick={() => setFormRules(prev => ({ ...prev, web_clock_enabled: !prev.web_clock_enabled }))}
              className="text-[var(--text-main)]"
            >
              {formRules.web_clock_enabled ? (
                <ToggleRight size={32} className="theme-accent-text" />
              ) : (
                <ToggleLeft size={32} className="text-[var(--text-muted)]" />
              )}
            </button>
          </div>

          {/* IP Restriction Toggle */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--text-main)]">IP Whitelist Guard</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">Restrict punch to corporate IPs</div>
            </div>
            <button
              onClick={() => setFormRules(prev => ({ ...prev, ip_restriction_enabled: !prev.ip_restriction_enabled }))}
              className="text-[var(--text-main)]"
            >
              {formRules.ip_restriction_enabled ? (
                <ToggleRight size={32} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={32} className="text-[var(--text-muted)]" />
              )}
            </button>
          </div>

          {/* Geofence Guard Toggle */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--text-main)]">GPS Geofence Guard</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">Restrict punch to office radius</div>
            </div>
            <button
              onClick={() => setFormRules(prev => ({ ...prev, geofence_enabled: !prev.geofence_enabled }))}
              className="text-[var(--text-main)]"
            >
              {formRules.geofence_enabled ? (
                <ToggleRight size={32} className="text-purple-500" />
              ) : (
                <ToggleLeft size={32} className="text-[var(--text-muted)]" />
              )}
            </button>
          </div>

          {/* Biometric Sync Toggle */}
          <div className="bg-[var(--bg-subtle)] border border-[var(--border-color)] p-4 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--text-main)]">Biometric Sync</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">Auto-sync biometric devices</div>
            </div>
            <button
              onClick={() => setFormRules(prev => ({ ...prev, biometric_sync_enabled: !prev.biometric_sync_enabled }))}
              className="text-[var(--text-main)]"
            >
              {formRules.biometric_sync_enabled ? (
                <ToggleRight size={32} className="text-amber-500" />
              ) : (
                <ToggleLeft size={32} className="text-[var(--text-muted)]" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Shift Late Grace Period (Minutes)</label>
            <input
              type="number"
              value={formRules.default_grace_period_minutes}
              onChange={e => setFormRules(prev => ({ ...prev, default_grace_period_minutes: parseInt(e.target.value) || 0 }))}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--text-main)] font-mono focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Half-Day Work Threshold (Hours)</label>
            <input
              type="number"
              step="0.5"
              value={formRules.half_day_threshold_hours}
              onChange={e => setFormRules(prev => ({ ...prev, half_day_threshold_hours: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--text-main)] font-mono focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* IP Whitelist & Geofence Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IP Whitelist Card */}
        <Card className="p-5 space-y-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Globe size={16} className="text-emerald-500" />
              Corporate IP Whitelist
            </h4>
            <span className="text-xs font-mono text-[var(--text-muted)]">{ipList.length} Active IPs</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. 203.0.113.42"
              value={newIP}
              onChange={e => setNewIP(e.target.value)}
              className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <input
              type="text"
              placeholder="Description (e.g. HQ Gateway)"
              value={newIPDesc}
              onChange={e => setNewIPDesc(e.target.value)}
              className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-2 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <button
              onClick={() => addIPMut.mutate({ ip_address: newIP, description: newIPDesc })}
              disabled={!newIP}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded text-xs font-mono font-medium flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="divide-y divide-[var(--border-color)] text-xs font-mono">
            {ipList.length === 0 ? (
              <div className="py-6 text-center text-[var(--text-muted)]">No IP addresses whitelisted yet.</div>
            ) : (
              ipList.map(ip => (
                <div key={ip.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-500 font-semibold">{ip.ip_address}</span>
                    <span className="text-[var(--text-muted)] text-[11px] ml-2">({ip.description || 'No label'})</span>
                  </div>
                  <button
                    onClick={() => deleteIPMut.mutate(ip.id)}
                    className="text-[var(--text-muted)] hover:text-rose-500 p-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Geofence Locations Card */}
        <Card className="p-5 space-y-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <MapPin size={16} className="text-purple-500" />
              Office Geofence Boundaries
            </h4>
            <span className="text-xs font-mono text-[var(--text-muted)]">{fenceList.length} Active Boundaries</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Name (e.g. HQ)"
              value={fenceName}
              onChange={e => setFenceName(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-1.5 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Latitude"
              value={fenceLat}
              onChange={e => setFenceLat(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-1.5 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={fenceLon}
              onChange={e => setFenceLon(e.target.value)}
              className="bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded p-1.5 text-xs font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
            />
            <button
              onClick={() => addFenceMut.mutate({
                name: fenceName,
                latitude: parseFloat(fenceLat) || 0,
                longitude: parseFloat(fenceLon) || 0,
                radius_meters: parseInt(fenceRadius) || 100
              })}
              disabled={!fenceName || !fenceLat || !fenceLon}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Plus size={14} /> Add Fence
            </button>
          </div>

          <div className="divide-y divide-[var(--border-color)] text-xs font-mono">
            {fenceList.length === 0 ? (
              <div className="py-6 text-center text-[var(--text-muted)]">No office geofences defined yet.</div>
            ) : (
              fenceList.map(fence => (
                <div key={fence.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-purple-500 font-semibold">{fence.name}</span>
                    <span className="text-[var(--text-muted)] text-[11px] ml-2">
                      ({fence.latitude}, {fence.longitude}) • Radius: {fence.radius_meters}m
                    </span>
                  </div>
                  <span className="bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded text-[10px]">
                    ACTIVE
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Biometric Adapter Hardware Section */}
      <Card className="p-5 space-y-4 bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Cpu size={16} className="text-amber-500" />
            Biometric Hardware Provider Adapter Status
          </h4>
          <button
            onClick={() => bioSyncMut.mutate()}
            disabled={bioSyncMut.isPending}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={bioSyncMut.isPending ? 'animate-spin' : ''} />
            Trigger Device Log Sync
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-[var(--bg-subtle)] p-3.5 rounded border border-[var(--border-color)]">
            <div className="text-[var(--text-muted)] text-[11px]">Primary Adapter</div>
            <div className="text-[var(--text-main)] font-bold mt-1">ZKTeco / Matrix Provider</div>
          </div>
          <div className="bg-[var(--bg-subtle)] p-3.5 rounded border border-[var(--border-color)]">
            <div className="text-[var(--text-muted)] text-[11px]">Sync Mode</div>
            <div className="text-emerald-500 font-bold mt-1">Real-time Push & Poll</div>
          </div>
          <div className="bg-[var(--bg-subtle)] p-3.5 rounded border border-[var(--border-color)]">
            <div className="text-[var(--text-muted)] text-[11px]">Active Devices</div>
            <div className="text-amber-500 font-bold mt-1">3 Connected Gateways</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
