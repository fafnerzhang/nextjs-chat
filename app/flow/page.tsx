'use client'
import Dagre from '@dagrejs/dagre'
import { useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  ReactFlowInstance,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Panel,
  addEdge
} from '@xyflow/react'
import { Node, Edge, EdgeProps, Connection } from '@xyflow/react' // Example import, adjust based on actual API

import { initialNodes, initialEdges } from './nodes.edges'
import '@xyflow/react/dist/style.css'
import { IconBookmark, IconPlus, IconAlignLeft } from '@/components/ui/icons'
import { set } from 'date-fns'
import { StartNode } from './node'
const nodeTypes = {
  start: StartNode
}

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: { direction: string }
): { nodes: Node[]; edges: Edge[] } => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: options.direction })

  edges.forEach(edge => g.setEdge(edge.source, edge.target))
  nodes.forEach(node =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0
    })
  )

  Dagre.layout(g)

  return {
    nodes: nodes.map((node: any) => {
      const position = g.node(node.id)
      const x = position.x - (node.measured?.width ?? 0) / 2
      const y = position.y - (node.measured?.height ?? 0) / 2
      return { ...node, position: { x, y } }
    }),
    edges
  }
}

const LayoutFlow = () => {
  const flowInstance = useReactFlow()
  const fitView = flowInstance?.fitView
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0
  })
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null)

  const onPaneClick = useCallback(() => {
    if (!flowInstance || !openMouseObj) return
    const position = { x: mousePosition.x, y: mousePosition.y }
    const id = Math.random().toString(36).substr(2, 9)
    const newNode = {
      id,
      type: 'default', // Adjust type as needed
      position,
      data: { label: `${id} node` }
    }
    setNodes(nds => nds.concat(newNode))
    setOpenMouseObj(false)
  }, [flowInstance, mousePosition, setNodes])

  const onLayout = useCallback(
    (direction: string) => {
      const layouted = getLayoutedElements(nodes, edges, { direction })

      setNodes([...layouted.nodes])
      setEdges([...layouted.edges])

      window.requestAnimationFrame(() => {
        fitView()
      })
    },
    [nodes, edges]
  )
  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(node => node.id === params.source)
    const targetNode = nodes.find(node => node.id === params.target)

    // Check if the source is a 'start' node and the target is an 'input' node
    if (sourceNode?.type === 'input' && targetNode?.type === 'start') {
      // Optionally, show an alert or a notification to the user
      console.log('Start nodes cannot connect to input nodes.')
      return // Prevent the connection
    }
    setEdges(eds => addEdge(params, eds))
  }, [])

  // Update the new state on mouse move over the ReactFlow container

  const onMouseMove = useCallback(event => {
    if (!flowInstance) return
    const pos = flowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    })
    const mousePos = {
      x: pos.x,
      y: pos.y,
      clientX: event.clientX,
      clientY: event.clientY
    }
    setMousePosition(mousePos)
  }, [])
  const [openMouseObj, setOpenMouseObj] = useState(false)
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        onMouseMove={onMouseMove}
        // fitView
      >
        <Panel position="bottom-left">
          <div
            role="group"
            className="flex items-center bg-white rounded-l shadow"
          >
            <button
              onClick={() => setOpenMouseObj(prev => !prev)}
              className="flex justify-center items-center p-2 m-0.5 hover:bg-gray-100 rounded"
            >
              <IconPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onLayout('LR')
                // LR
              }}
              className="flex justify-center items-center p-2 m-0.5 hover:bg-gray-100 rounded"
            >
              <IconAlignLeft className="w-4 h-4" />
            </button>
          </div>
        </Panel>
        {openMouseObj && (
          <div
            className="absolute w-5 h-5 rounded-full bg-red-500/50 z-10"
            style={{
              left: `${mousePosition.clientX + 10}px`,
              top: `${mousePosition.clientY - 60}px`
            }}
          >
            <StartNode id={'1'} type={'input'} data={{ label: 'input' }} />
          </div>
        )}
      </ReactFlow>
    </div>
  )
}

export default function () {
  return (
    <div className="w-[80vw] h-[80vh]">
      <ReactFlowProvider>
        <LayoutFlow />
      </ReactFlowProvider>
    </div>
  )
}
