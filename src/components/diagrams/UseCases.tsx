'use client'

import { useState } from 'react'
import styles from './UseCases.module.css'

interface UseCase {
  id: string
  title: string
  actor: string
  description: string
  preconditions: string[]
  steps: string[]
  postconditions: string[]
  channels?: string[]
  tools?: string[]
  skills?: string[]
}

interface UseCasesProps {
  useCases?: UseCase[]
}

const DEFAULT_USE_CASES: UseCase[] = [
  {
    id: 'uc-01',
    title: '用户通过 Telegram 发送任务指令',
    actor: 'User',
    description: '用户在任何支持的 IM 平台（以 Telegram 为例）向 OpenClaw 发送自然语言指令，AI 自动理解意图并执行任务。',
    preconditions: [
      '用户已完成 OpenClaw 安装和 Telegram Bot 配置',
      '用户已完成 Telegram Bot 与 OpenClaw Gateway 的配对',
      'Gateway 正在监听 :18789 端口'
    ],
    steps: [
      '用户在 Telegram 向 Bot 发送消息："帮我查一下明天的天气"',
      'Telegram 服务器将消息作为 Webhook POST 请求发送到 Gateway',
      'Gateway 解析消息，查询/创建用户会话',
      'Gateway 将消息转发给 Pi Agent',
      'Pi Agent 从 Memory 检索对话上下文',
      'Pi Agent 调用 web_search 工具查询天气',
      'Pi Agent 综合结果生成回复文本',
      'Gateway 将回复通过 Telegram Bot API 发回给用户'
    ],
    postconditions: [
      '用户收到天气查询结果',
      '对话历史已保存到 Session Context'
    ],
    channels: ['Telegram'],
    tools: ['Web Search'],
    skills: [],
  },
  {
    id: 'uc-02',
    title: 'Agent 调用工具执行多步骤任务',
    actor: 'AI Agent (Pi)',
    description: '当用户请求的任务需要多个步骤时，Pi Agent 自动规划工具调用序列，按序执行并收集结果。',
    preconditions: [
      'Pi Agent 已接收用户任务指令',
      '相关工具已注册到 Tool Registry'
    ],
    steps: [
      'Pi Agent 解析用户意图：需要预订东京到北京的机票',
      'Pi Agent 调用 web_search 工具搜索航班信息',
      'Pi Agent 收到搜索结果，筛选最优选项',
      'Pi Agent 调用 calendar 工具查询用户空闲时间',
      'Pi Agent 调用 HTTP Client 工具向航司 API 发起预订请求',
      'Pi Agent 汇总所有结果，生成包含预订链接的回复',
      'Gateway 将回复发送回用户'
    ],
    postconditions: [
      '用户收到航班选项和预订链接',
      '中间结果已保存到临时上下文'
    ],
    channels: [],
    tools: ['Web Search', 'HTTP Client', 'Calculator'],
    skills: ['flight-booking'],
  },
  {
    id: 'uc-03',
    title: '从 ClawHub 安装新技能',
    actor: 'User / AI Agent',
    description: '当内置技能无法满足需求时，系统自动从 ClawHub 搜索、安装并使用新技能。',
    preconditions: [
      '用户已配置 ClawHub API 访问',
      '目标技能已在 ClawHub 注册'
    ],
    steps: [
      '用户发送指令："用 Notion 创建一个任务"',
      'Pi Agent 识别需要 Notion 集成技能',
      'Pi Agent 查询 ClawHub 找到 notion-create-task 技能',
      'Pi Agent 自动下载并安装该技能',
      'Pi Agent 调用新安装的 Notion 技能创建任务',
      '结果返回给用户'
    ],
    postconditions: [
      '新技能已安装并可用',
      '任务已创建到用户指定的 Notion 工作区'
    ],
    channels: [],
    tools: ['HTTP Client'],
    skills: ['clawhub-search', 'notion-create-task'],
  },
  {
    id: 'uc-04',
    title: 'Canvas 视觉工作空间协作',
    actor: 'User',
    description: '用户通过 Canvas 在可视化工作空间中进行操作，AI 实时响应操作并执行对应任务。',
    preconditions: [
      '用户在 macOS/iOS/Android 设备上打开 OpenClaw Canvas',
      'Canvas 已与 Gateway 建立 WebSocket 连接'
    ],
    steps: [
      '用户在 Canvas 上拖拽一个文件节点到 Agent 节点',
      'Canvas 发送交互事件到 Gateway',
      'Gateway 路由到 Pi Agent',
      'Pi Agent 识别用户意图：分析这个文件',
      'Pi Agent 调用 file_read 工具读取文件',
      'Pi Agent 在 Canvas 上渲染分析结果节点',
      '用户继续与结果交互，形成人机协作循环'
    ],
    postconditions: [
      '分析结果以可视化方式展示在 Canvas 上',
      '操作历史已保存'
    ],
    channels: [],
    tools: ['File System'],
    skills: [],
  },
  {
    id: 'uc-05',
    title: 'Voice 语音交互（macOS/iOS）',
    actor: 'User',
    description: '用户使用语音唤醒词激活 AI，通过语音指令控制智能家居、查询信息、执行任务。',
    preconditions: [
      '用户设备为 macOS 或 iOS',
      'Voice Wake 功能已启用',
      '麦克风权限已授权'
    ],
    steps: [
      '用户说出唤醒词："Hey OpenClaw"',
      'Voice Wake 检测到唤醒词，激活 AI',
      '用户说出语音指令："帮我设置明天早上7点的闹钟"',
      'Voice 模块将语音转为文字',
      '文字消息路由到 Pi Agent',
      'Pi Agent 调用 system_tools 技能设置闹钟',
      '响应结果通过 ElevenLabs TTS 语音播报给用户',
      '唤醒词再次进入监听状态'
    ],
    postconditions: [
      '闹钟已在系统设置中创建',
      '响应已通过语音反馈给用户'
    ],
    channels: [],
    tools: ['System Tools'],
    skills: ['alarm-set'],
  },
  {
    id: 'uc-06',
    title: '多渠道消息统一管理',
    actor: 'Gateway',
    description: '用户在不同平台（Telegram、Discord、WhatsApp）同时使用 OpenClaw，所有消息统一路由到同一 Agent，统一管理会话状态。',
    preconditions: [
      '用户已在多个渠道完成 Bot 配置',
      '所有 Bot webhook 均指向同一 Gateway'
    ],
    steps: [
      '用户从 WhatsApp 发送消息，Gateway 接收并路由到 Pi Agent',
      'Pi Agent 生成回复，Gateway 通过 WhatsApp 发回',
      '同一用户在 Discord 也发送消息',
      'Gateway 识别为同一用户（相同 Pairing ID）',
      'Pi Agent 将 Discord 消息加入同一会话上下文',
      'Agent 理解跨渠道对话历史，给出个性化回复',
      '回复通过 Discord Bot 发送'
    ],
    postconditions: [
      '跨渠道会话上下文统一管理',
      'AI 理解跨平台对话的连贯性'
    ],
    channels: ['WhatsApp', 'Discord', 'Telegram'],
    tools: [],
    skills: [],
  },
]

export default function UseCases({ useCases = DEFAULT_USE_CASES }: UseCasesProps) {
  const [selected, setSelected] = useState<string>(useCases[0]?.id || '')
  const [showAll, setShowAll] = useState(false)

  const active = useCases.find(uc => uc.id === selected) || useCases[0]
  const visible = showAll ? useCases : useCases.slice(0, 3)

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <div className={styles.listHeader}>Use Cases ({useCases.length})</div>
        {visible.map(uc => (
          <button
            key={uc.id}
            className={`${styles.ucItem} ${selected === uc.id ? styles.active : ''}`}
            onClick={() => setSelected(uc.id)}
          >
            <span className={styles.ucId}>{uc.id}</span>
            <span className={styles.ucTitle}>{uc.title}</span>
            <span className={styles.ucActor}>{uc.actor}</span>
          </button>
        ))}
        {useCases.length > 3 && (
          <button className={styles.showMore} onClick={() => setShowAll(!showAll)}>
            {showAll ? '▲ Show less' : `▼ Show ${useCases.length - 3} more`}
          </button>
        )}
      </div>

      {active && (
        <div className={styles.detail}>
          <div className={styles.detailHeader}>
            <span className={styles.detailId}>{active.id}</span>
            <h2 className={styles.detailTitle}>{active.title}</h2>
            <span className={styles.detailActor}>Actor: {active.actor}</span>
          </div>

          <p className={styles.description}>{active.description}</p>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🔍 Preconditions</h3>
            <ul className={styles.stepList}>
              {active.preconditions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📋 Steps</h3>
            <ol className={styles.ol}>
              {active.steps.map((s, i) => (
                <li key={i} className={styles.stepItem}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>✅ Postconditions</h3>
            <ul className={styles.stepList}>
              {active.postconditions.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {(active.channels?.length || active.tools?.length || active.skills?.length) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🛠️ Involves</h3>
              <div className={styles.tags}>
                {active.channels?.map(c => (
                  <span key={c} className={styles.tagChannel}>💬 {c}</span>
                ))}
                {active.tools?.map(t => (
                  <span key={t} className={styles.tagTool}>🛠️ {t}</span>
                ))}
                {active.skills?.map(s => (
                  <span key={s} className={styles.tagSkill}>⚡ {s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
