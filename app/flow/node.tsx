import {
  Handle,
  Position,
  NodeProps,
  useHandleConnections
} from '@xyflow/react'
import React, { memo } from 'react'

interface StartNodeProps extends NodeProps {
  data: {
    label: string
  }
}

export function StartNode(props: StartNodeProps) {
  return (
    <div className="w-20 h-60 bg-white">
      <Handle type="source" position={Position.Bottom} />
      <div>{props.data.label}</div>
      <Handle type="target" position={Position.Top} />
    </div>
  )
}
