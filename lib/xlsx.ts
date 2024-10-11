import * as XLSX from 'xlsx';
import { type SheetData } from '@/components/table/sheet';
import {parsePromptArgs} from '@/lib/utils'

const sheetsSchema: Record<string, string[]> = {
    prompt: ['template_name', 'prompt_template', 'description'],
    concat_prompt: ['concat_id', 'concat_template', 'post_processing_template', 'condition_id', 'description'],
    concat_condition: ['template_name', 'rel', 'value']
}

const conditionOptions: string[] = ['all', 'in', 'not in', '=']

interface validResponse {
    status: boolean
    message: string[]
}
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

export function validSheets(sheetsData: Record<string, SheetData>): validResponse {
    let status = true;
    const message = [];
    // validate columns
    const {status: colStatus, message: colMessage} = validSheetsColumns(sheetsData, sheetsSchema);
    status = status && colStatus;
    message.push(...colMessage);
    // validate prompt variable
    if (sheetsData.prompt?.data.length > 0){
        const {status: valStatus, message: valMessage} = validPromptVariable(sheetsData)
        status = status && valStatus;
        message.push(...valMessage);
    }
    // validate concat prompt
    if (sheetsData.concat_prompt?.data.length > 0){
        const {status: valStatus, message: valMessage} = validConcatPrompt(sheetsData)
        status = status && valStatus;
        message.push(...valMessage);
    }
    // valid concat condition
    if (sheetsData.concat_condition?.data.length > 0){
        const {status: valStatus, message: valMessage} = validConcatCondition(sheetsData, conditionOptions)
        status = status && valStatus;
        message.push(...valMessage);
    }
    return {status, message};
}

// Modified original function to use the new validateConcatConditionItem function
export function validConcatCondition(sheetsData: Record<string, SheetData>, conditionOptions: string[]): validResponse {
    let status = true;
    const message: string[] = [];
    const concatConditionRaw = sheetsData.concat_condition?.data;
    if (!concatConditionRaw) return {status, message};

    concatConditionRaw.forEach((item, index) => {
        const validationResult = validateConcatConditionItem(item, index, sheetsData, conditionOptions);
        if (!validationResult.status) status = false; // Update status if any validation fails
        message.push(...validationResult.message); // Accumulate messages
    });
    return {status, message};
}

function validateConcatConditionItem(item: any, index: number, sheetsData: Record<string, SheetData>, conditionOptions: string[]): validResponse {
    let status = true;
    const message: string[] = [];

    if (!conditionOptions.includes(item.rel)) {
        status = false;
        message.push(`Sheet concat_condition, row ${index + 1} has invalid condition '${item.rel}'`);
    }
    if (!sheetsData.hasOwnProperty(item.template_name)) {
        status = false;
        message.push(`Sheet concat_condition, row ${index + 1} has invalid template_name '${item.template_name}'`);
    }
    const itemValue = item.value?.replace(/[\[\]]/g, '').split(',').map((val: string) => val.trim());
    if (item.rel === 'in' && Array.isArray(itemValue)) {
        const templateData = sheetsData[item.template_name]?.data;
        const combIds = templateData.map(row => String(row.comb_id));
        const flatValue: string[] = []
        itemValue.forEach(val=>{
            if (val.includes('-')){
                const [start, end] = val.split('-').map(Number)
                for (let i=start; i<=end; i++){
                    flatValue.push(String(i))
                }
            } else {
                flatValue.push(String(val))
            }
        })
        flatValue.forEach(val => {
            if (!combIds.includes(String(val))) {
                status = false;
                message.push(`Sheet concat_condition, row ${index + 1} has invalid comb_id '${val}' in value for template_name '${item.template_name}'`);
            }
        });
    }
    if (item.rel === '=') {
        const itemValue = item.value.replace(/[\[\]]/g, '')
        const templateData = sheetsData[item.template_name]?.data;
        const combIds = templateData.map(row => row.comb_id);
        if (!combIds.includes(itemValue)) {
            status = false;
            message.push(`Sheet concat_condition, row ${index + 1} has invalid comb_id '${item.value}' in value for template_name '${item.template_name}'`);
        }
    }

    return { status, message };
}


export function validSheetsColumns(sheetsData: Record<string, SheetData>, schema: Record<string, string[]>): validResponse {
    let status = true;
    const message = [];
    for (const sheetSchema in schema) {
        const columnsSet = new Set(schema[sheetSchema]);
        const keysSet = new Set(sheetsData[sheetSchema]?.headers);
        const intersectionSet = new Set([...Array.from(columnsSet)].filter(x => keysSet.has(x))); 
        if (intersectionSet.size !== columnsSet.size) {
            status = false;
            const missingColumns = Array.from(columnsSet).filter(col => !keysSet.has(col));
            message.push(`Sheet ${sheetSchema} is missing columns: ${missingColumns.join(', ')}`);
        }
    }
    return {status, message};
}

export function validPromptVariable(sheetsData: Record<string, SheetData>): validResponse {
    let status = true;
    const message: string[] = [];
    const promptTemplate = sheetsData['prompt']?.data;
    if (!promptTemplate) return { status, message }; // Early return if promptTemplate is undefined

    const promptKwargs = promptTemplate.map((item) => {
        return parsePromptArgs(item.prompt_template)
    });

    const promptTemplateNames = promptTemplate.map((item) => item.template_name);

    for (let i = 0; i < promptTemplateNames.length; i++) {
        const templateName = promptTemplateNames[i];
        const kwargsSet = new Set(promptKwargs[i])

        const templateData = sheetsData[templateName]?.data;

        if (!templateData) {
            status = false;
            message.push(`Sheet ${templateName} does not exist`);
            continue;
        }
        for (let j = 0; j < templateData.length; j++) {
            const row = templateData[j];
            const rowKeysSet = new Set(Object.keys(row));
            const intersection = new Set([...Array.from(rowKeysSet)].filter(x => kwargsSet.has(x)));
            if (intersection.size !== kwargsSet.size) {
                status = false;
                const missingKeys = [...Array.from(kwargsSet)].filter(x => !rowKeysSet.has(x));
                message.push(`Sheet ${templateName}, comb_id: ${row.comb_id} is missing columns '${missingKeys.join(', ')}'`);
            }
        }
    }

    return { status, message };
}

export function validConcatPrompt(sheetsData: Record<string, SheetData>):validResponse{
    let status = true
    const message: string[] = []
    const concatPrompt = sheetsData.concat_prompt?.data
    const sheetNames = Object.keys(sheetsData)
    if (!concatPrompt) return {status, message}
    const concatPromptKwargs = concatPrompt.map((item) => {
        return parsePromptArgs(item.concat_template)
    })
    for (let i=0; i<concatPromptKwargs.length; i++){
    const promptKwargs = new Set(concatPromptKwargs[i])
    const intersection = new Set([...Array.from(promptKwargs)].filter(x => sheetNames.includes(x)))
    if (intersection.size !== promptKwargs.size){
        status = false
        const missingSheets = [...Array.from(promptKwargs)].filter(x => !sheetNames.includes(x))
        message.push(`Concat Prompt ${concatPrompt[i].concat_id} is missing sheets '${missingSheets.join(', ')}'`)
        }
    }
    return {status, message}
}