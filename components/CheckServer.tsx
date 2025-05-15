import { StatusBadge } from "@/components/server-status-badge"
import {
  RiCheckboxCircleFill,
  RiIndeterminateCircleFill,
  RiIndeterminateCircleLine,
  RiCloseCircleFill,
  RiCloseCircleLine,
  RiShieldCheckLine,
} from '@remixicon/react'

export function CheckServer() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <StatusBadge 
        leftIcon={RiCheckboxCircleFill}
        rightIcon={RiShieldCheckLine}
        leftLabel="Live"
        rightLabel="Server"
        status="success"
      />
      <StatusBadge 
        leftIcon={RiIndeterminateCircleFill}
        rightIcon={RiIndeterminateCircleLine}
        leftLabel="Running"
        rightLabel="Server"
        status="running"
      />
      <StatusBadge 
        leftIcon={RiCloseCircleFill}
        rightIcon={RiCloseCircleLine}
        leftLabel="Live"
        rightLabel="Server"
        status="error"
      />
    </div>
  )
}