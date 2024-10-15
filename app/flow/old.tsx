'use client'
import React, { useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from '@xyflow/react'

const exampleSheetData: Record<string, any> = {
  prompt: {
    data: [
      {
        template_name: '開場白',
        prompt_template:
          '你現在是一個理財專員請生成給{客戶}的開場白，使用{風格}，{限制}',
        kwargs: ['客戶', '風格', '限制'],
        description: '開場白'
      },
      {
        template_name: '結尾',
        prompt_template:
          '你現在是一個理財專員請生成給{客戶}的結尾，使用{風格}，{限制}',
        kwargs: ['客戶', '風格', '限制'],
        description: '結尾'
      }
    ],
    headers: ['template_name', 'prompt_template', 'kwargs', 'description']
  },
  concat_prompt: {
    data: [
      {
        concat_id: 1,
        concat_template: '{開場白}, {結尾}',
        post_processing_template: '',
        condition_id: 1,
        description: '給窮鬼的',
        kwargs: ['開場白', '結尾']
      },
      {
        concat_id: 2,
        concat_template: '{開場白}, {結尾}',
        post_processing_template:
          '請幫我將以下的句子改為畢恭畢敬的態度{concat_template}',
        condition_id: 2,
        description: '給有錢人的',
        kwargs: ['開場白', '結尾']
      }
    ],
    headers: [
      'concat_id',
      'concat_template',
      'post_processing_template',
      'condition_id',
      'description',
      'kwargs'
    ]
  },
  concat_condition: {
    data: [
      {
        condition_id: 1,
        template_name: '開場白',
        rel: 'all',
        value: null
      },
      {
        condition_id: 1,
        template_name: '結尾',
        rel: 'in',
        value: [1, 2, 3, 4]
      },
      {
        condition_id: 2,
        template_name: '開場白',
        rel: 'all',
        value: null
      },
      {
        condition_id: 2,
        template_name: '結尾',
        rel: 'in',
        value: [1, 2, 3]
      }
    ],
    headers: ['condition_id', 'template_name', 'rel', 'value']
  },
  開場白: {
    data: [
      { 客戶: '40-50歲的上班族', 風格: '輕鬆', 限制: '' },
      { 客戶: '30-40歲的上班族', 風格: '正式', 限制: '' },
      { 客戶: '50-60歲的退休族', 風格: '輕鬆', 限制: '' }
    ],
    headers: ['客戶', '風格', '限制']
  },
  結尾: {
    data: [
      { 客戶: '40-50歲的上班族', 風格: '輕鬆', 限制: '' },
      { 客戶: '30-40歲的上班族', 風格: '正式', 限制: '' },
      { 客戶: '50-60歲的退休族', 風格: '輕鬆', 限制: '' },
      { 客戶: '50-60歲的退休族', 風格: '輕鬆', 限制: '' },
      { 客戶: '80歲的退休族', 風格: '輕鬆', 限制: '' }
    ],
    headers: ['客戶', '風格', '限制']
  }
}

function FlowPage() {
  // Step 1: Extract Data
  const { prompt, concat_prompt, concat_condition } = exampleSheetData
  const baseHorizontalSpacing = 200 // Increase horizontal spacing
  const baseVerticalSpacing = 100 // Vertical spacing between different types of nodes
  const rowCapacity = 5 // Number of nodes per row before wrapping to a new row

  const templateNodes = prompt.data.map((item, index) => ({
    id: `template-${item.template_name}`,
    position: { x: 0, y: index * baseVerticalSpacing * 2 }, // Increased vertical spacing
    data: { label: item.template_name }
  }))

  const promptNodes = prompt.data.flatMap(item => {
    const templateData = exampleSheetData[item.template_name]?.data
    if (!templateData) {
      return [
        {
          id: `prompt-${item.template_name}-fallback`,
          position: { x: 0, y: 0 }, // Example positioning for fallback
          data: { label: item.template_name } // Fallback if no data found
        }
      ]
    }
    // Generate a node for each record in the templateData
    return templateData.map((dataItem, dataIndex) => {
      // Replace placeholders in prompt_template with actual data from dataItem
      const rowNumber = Math.floor(dataIndex / rowCapacity)
      const columnIndex = dataIndex % rowCapacity
      const modifiedPromptTemplate = item.prompt_template.replace(
        /\{(.*?)\}/g,
        (_, key) => dataItem[key] || `{${key}}`
      )

      return {
        id: `prompt-${item.template_name}-${dataIndex}`,
        position: {
          x: baseHorizontalSpacing * columnIndex,
          y: rowNumber * baseVerticalSpacing
        }, // Example positioning
        data: { label: modifiedPromptTemplate } // Use modified prompt template
      }
    })
  })
  const templateToConcatEdges = templateNodes.flatMap(templateNode => {
    return concat_prompt.data.map((concatItem, index) => ({
      id: `template-${templateNode.id}-to-concat-${concatItem.concat_id}`,
      source: templateNode.id,
      target: `concat-${concatItem.concat_id}`
      // Additional properties for the edge can be added here
    }))
  })
  const promptToTemplateEdges = promptNodes
    .map(promptNode => {
      // Extract template_name from promptNode id
      const templateNameMatch = promptNode.id.match(/^prompt-(.+?)-\d+$/)
      if (!templateNameMatch) return null // Skip if no match found

      const templateName = templateNameMatch[1]
      const templateNodeId = `template-${templateName}`

      return {
        id: `edge-${templateNodeId}-to-${promptNode.id}`,
        source: templateNodeId, // ID of the templateNode
        target: promptNode.id // ID of the promptNode
      }
    })
    .filter(edge => edge !== null)
  // Step 3: Create Concat Prompt Nodes
  const concatPromptNodes = concat_prompt.data.map((item, index) => ({
    id: `concat-${item.concat_id}`,
    position: { x: 200 * index, y: 200 }, // Increased horizontal spacing
    data: { label: item.concat_template }
  }))

  // Step 4: Determine Edges Based on Conditions
  const initialEdges = []
  concat_prompt.data.forEach(concatItem => {
    const conditions = concat_condition.data.filter(
      cond => cond.condition_id === concatItem.condition_id
    )
    conditions.forEach(cond => {
      prompt.data.forEach((promptItem, promptIndex) => {
        if (cond.template_name === promptItem.template_name) {
          initialEdges.push({
            id: `e${promptIndex}-concat-${concatItem.concat_id}`,
            source: `prompt-${promptIndex}`,
            target: `concat-${concatItem.concat_id}`
          })
        }
      })
    })
  })

  // Step 5: Combine Nodes and Edges
  const allNodes = [...promptNodes, ...templateNodes, ...concatPromptNodes]
  const allEdges = [
    ...concatPromptNodes,
    ...templateToConcatEdges,
    ...promptToTemplateEdges
  ]
  // Output the nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges)
  const onConnect = useCallback(
    (params: any) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  )
  return (
    <div className="w-[80vw] h-[80vh]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      />
    </div>
  )
}

export default FlowPage
