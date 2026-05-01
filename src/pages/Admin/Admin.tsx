import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tabs } from '@/components/Tabs/Tabs'
import { useEntries } from '@/hooks/useEntries'
import t from '@/i18n/he.json'
import { DepartmentsTab } from './tabs/DepartmentsTab'
import { LiveList } from './tabs/LiveList'
import { LogTab } from './tabs/LogTab'

type AdminTab = 'live' | 'log' | 'depts'

export function Admin() {
  const [tab, setTab] = useState<AdminTab>('live')
  const { entries, loading, error } = useEntries()

  return (
    <div>
      <div className="page-header">
        <Link className="link-back" to="/">
          {t.common.back}
        </Link>
        <span className="page-header__spacer" />
      </div>

      <h1 className="page-title">{t.home.adminBtn}</h1>

      <Tabs
        activeId={tab}
        onChange={(id) => setTab(id as AdminTab)}
        tabs={[
          { id: 'live', label: t.admin.tabLive },
          { id: 'log', label: t.admin.tabLog },
          { id: 'depts', label: t.admin.tabDepts },
        ]}
      />

      {tab === 'live' ? (
        <>
          <div className="stats-row">
            <span className="stats-row__label">{t.admin.totalInside}</span>
            <span className="stats-row__value">
              {loading ? '…' : error ? '—' : entries.length}
            </span>
          </div>
          <LiveList entries={entries} loading={loading} error={error} />
        </>
      ) : null}

      {tab === 'log' ? <LogTab /> : null}
      {tab === 'depts' ? <DepartmentsTab /> : null}
    </div>
  )
}
