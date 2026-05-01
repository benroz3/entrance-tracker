import { Link } from 'react-router-dom'
import t from '@/i18n/he.json'

export function Home() {
  return (
    <div className="home-screen">
      <h1 className="page-title">{t.home.title}</h1>
      <div className="home-screen__actions">
        <Link className="btn btn--primary" to="/worker/checkin">
          {t.home.workerBtn}
        </Link>
        <Link className="btn btn--primary" to="/admin/pin">
          {t.home.adminBtn}
        </Link>
      </div>
    </div>
  )
}
