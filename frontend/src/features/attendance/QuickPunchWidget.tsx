import React, { useState, useEffect } from 'react'
import { LogIn, LogOut, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react'

export const QuickPunchWidget: React.FC = () => {
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Fetch initial punch status
  useEffect(() => {
    const fetchPunchStatus = async () => {
      try {
        const res = await fetch('/api/v1/attendance/punch-status', {
          headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') || localStorage.getItem('token')}` }
        })
        if (res.ok) {
          const data = await res.json()
          setIsCheckedIn(data.is_checked_in)
          setCheckInTime(data.check_in_time)
          setElapsedSeconds(data.elapsed_seconds || 0)
        }
      } catch (err) {
        console.error('Failed to fetch punch status', err)
      }
    }
    fetchPunchStatus()
  }, [])

  // Timer tick interval when checked in
  useEffect(() => {
    let interval: any = null
    if (isCheckedIn) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isCheckedIn])

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle single-click Check In / Check Out toggle
  const handlePunchToggle = async () => {
    setIsLoading(true)
    const action = isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN'
    try {
      const res = await fetch('/api/v1/attendance/punch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, notes: 'Navbar Quick Punch' })
      })

      if (res.ok) {
        if (!isCheckedIn) {
          setIsCheckedIn(true)
          const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false })
          setCheckInTime(nowStr)
          setElapsedSeconds(0)
          setSuccessToast('Successfully Checked In!')
        } else {
          setIsCheckedIn(false)
          setCheckInTime(null)
          setSuccessToast('Successfully Checked Out!')
        }
        setTimeout(() => setSuccessToast(null), 3000)
      }
    } catch (err) {
      console.error('Punch action failed', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex items-center gap-3">
      {/* Success Toast */}
      {successToast && (
        <div className="absolute top-12 right-0 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg backdrop-blur-md z-50 animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Live Running Counter Badge when Checked In */}
      {isCheckedIn && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium shadow-inner">
          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>{formatTimer(elapsedSeconds)}</span>
          {checkInTime && <span className="text-[10px] text-amber-400/60 font-sans">({checkInTime})</span>}
        </div>
      )}

      {/* Primary Check-In / Check-Out Toggle Button */}
      <button
        onClick={handlePunchToggle}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all duration-200 shadow-md ${
          isCheckedIn
            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/50'
            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isCheckedIn ? (
          <>
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span>Check Out</span>
          </>
        ) : (
          <>
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Check In</span>
          </>
        )}
      </button>

      {/* Corporate IP Protection Indicator */}
      <div title="Corporate IP Protection Active" className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hidden md:flex items-center">
        <ShieldCheck className="w-3.5 h-3.5" />
      </div>
    </div>
  )
}
