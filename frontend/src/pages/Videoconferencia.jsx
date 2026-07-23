import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout/Layout'
import { ROLE_LABELS } from '../utils/roles'
import { Trash2 } from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

export default function Videoconferencia() {
  const { profile } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    privacy: 'public',
    access_code: '',
    participant_ids: [],
  })
  const [contacts, setContacts] = useState([])
  const [createdCode, setCreatedCode] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(null)
  const callFrameRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (selectedRoom) return
    loadRooms()
    loadContacts()
  }, [profile, selectedRoom])

  async function loadRooms() {
    if (!profile) return
    setLoading(true)

    const { data: participated } = await supabase
      .from('video_participants')
      .select('room_id')
      .eq('user_id', profile.id)

    const roomIds = participated?.map(p => p.room_id) || []

    const { data: owned } = await supabase
      .from('video_rooms')
      .select('*')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false })

    const { data: joined } = roomIds.length
      ? await supabase
          .from('video_rooms')
          .select('*')
          .in('id', roomIds)
          .neq('created_by', profile.id)
          .order('created_at', { ascending: false })
      : { data: [] }

    const allRooms = [...(owned || []), ...(joined || [])]
    const seen = new Set()
    const unique = allRooms.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })

    setRooms(unique)
    setLoading(false)
  }

  async function loadContacts() {
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, role')
      .neq('id', profile?.id)
      .eq('ativo', true)
      .neq('role', 'requerente')
      .order('nome')

    setContacts(data || [])
  }

  function toggleParticipant(id) {
    setForm(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(id)
        ? prev.participant_ids.filter(pid => pid !== id)
        : [...prev.participant_ids, id],
    }))
  }

  async function handleCreate() {
    if (!profile) return
    setCreating(true)

    try {
      const payload = {
        created_by: profile.id,
        privacy: form.privacy,
        access_code: form.privacy === 'private' ? form.access_code || null : null,
        participant_ids: form.participant_ids,
      }

      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erro ao criar sala')
      }

      const room = await res.json()

      if (form.privacy === 'private') {
        setCreatedCode(room.access_code)
      }

      await loadRooms()
      setForm({ privacy: 'public', access_code: '', participant_ids: [] })
    } catch (e) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinClick(room) {
    if (room.privacy === 'private') {
      setShowJoinCode(room)
      setJoinCode('')
      setJoinError('')
    } else {
      enterRoom(room)
    }
  }

  async function handleJoinWithCode() {
    if (!showJoinCode) return

    try {
      const res = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: showJoinCode.id,
          access_code: joinCode,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setJoinError(err.detail || 'Código inválido')
        return
      }

      const room = await res.json()
      setShowJoinCode(null)
      enterRoom(room)
    } catch (e) {
      setJoinError('Erro ao validar código')
    }
  }

  async function handleDeleteRoom(roomId) {
    if (!profile || deleting) return
    setDeleting(true)

    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}?user_id=${profile.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Erro ao excluir sala')
      }

      setRooms(prev => prev.filter(r => r.id !== roomId))
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(false)
      setConfirmDeleteRoom(null)
    }
  }

  function enterRoom(room) {
    setSelectedRoom(room)
  }

  function leaveRoom() {
    if (callFrameRef.current) {
      callFrameRef.current.destroy()
      callFrameRef.current = null
    }
    setSelectedRoom(null)
    setCreatedCode(null)
  }

  useEffect(() => {
    if (!selectedRoom || !containerRef.current) return

    let cancelled = false

    async function initCall() {
      try {
        const DailyIframe = (await import('@daily-co/daily-js')).default
        if (cancelled) return

        if (callFrameRef.current) {
          callFrameRef.current.destroy()
        }

        const frame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            borderRadius: '8px',
          },
        })

        callFrameRef.current = frame

        frame.on('left-meeting', () => {
          leaveRoom()
        })

        frame.join({ url: selectedRoom.url })
      } catch (e) {
        console.error('Erro ao iniciar Daily.co:', e)
      }
    }

    initCall()

    return () => {
      cancelled = true
    }
  }, [selectedRoom])

  function formatExpires(exp) {
    if (!exp) return ''
    const date = new Date(exp * 1000)
    return date.toLocaleString('pt-BR')
  }

  if (selectedRoom) {
    return (
      <div className="video-call-container">
        <div className="video-call-header">
          <button className="btn btn-sm" onClick={leaveRoom}>
            ← Sair da sala
          </button>
          <span className="video-call-name">{selectedRoom.room_name}</span>
        </div>
        <div className="video-call-frame" ref={containerRef} />
      </div>
    )
  }

  return (
    <Layout title="Videoconferência">
      <div className="page-header">
        <h2>Salas de Videoconferência</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Nova Sala
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma sala ativa no momento.</p>
          <p>Crie uma nova sala para iniciar uma videoconferência.</p>
        </div>
      ) : (
        <div className="video-room-list">
          {rooms.map(room => (
            <div key={room.id} className="video-room-card">
              <div className="video-room-info">
                <div className="video-room-name">
                  {room.privacy === 'private' ? '🔒 ' : '🌐 '}
                  {room.room_name}
                </div>
                <div className="video-room-meta">
                  <span>{room.privacy === 'private' ? 'Privada' : 'Pública'}</span>
                  {room.expires_at && (
                    <span>Expira em {formatExpires(room.expires_at)}</span>
                  )}
                </div>
              </div>
              <div className="video-room-actions">
                {room.created_by === profile?.id && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setConfirmDeleteRoom(room)}
                    title="Excluir sala"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleJoinClick(room)}
                >
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => { if (!creating) { setShowCreate(false); setCreatedCode(null) } }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Sala</h3>
              <button className="modal-close" onClick={() => { setShowCreate(false); setCreatedCode(null) }}>×</button>
            </div>

            {createdCode ? (
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>Sala criada!</strong>
                  <p>Compartilhe o código abaixo com os participantes:</p>
                  <div className="access-code-display">{createdCode}</div>
                  <p className="text-muted">A sala já aparece na lista dos participantes selecionados.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setShowCreate(false); setCreatedCode(null) }}>
                  Fechar
                </button>
              </div>
            ) : (
              <div className="modal-body">
                <div className="form-group">
                  <label>Privacidade</label>
                  <select
                    className="form-control"
                    value={form.privacy}
                    onChange={e => setForm(prev => ({ ...prev, privacy: e.target.value }))}
                  >
                    <option value="public">Pública</option>
                    <option value="private">Privada (código de acesso)</option>
                  </select>
                </div>

                {form.privacy === 'private' && (
                  <div className="form-group">
                    <label>Código de acesso (opcional — deixe em branco para gerar automático)</label>
                    <input
                      className="form-control"
                      type="text"
                      maxLength={6}
                      placeholder="Ex: 492831"
                      value={form.access_code}
                      onChange={e => setForm(prev => ({ ...prev, access_code: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Convidar participantes (opcional)</label>
                  <div className="participant-list">
                    {contacts.map(c => (
                      <label key={c.id} className="participant-item">
                        <input
                          type="checkbox"
                          checked={form.participant_ids.includes(c.id)}
                          onChange={() => toggleParticipant(c.id)}
                        />
                        <span>{c.nome}</span>
                        <span className="badge badge-{c.role}">{ROLE_LABELS[c.role]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn" onClick={() => setShowCreate(false)} disabled={creating}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                    {creating ? 'Criando...' : 'Criar Sala'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDeleteRoom && (
        <div className="modal-overlay" onClick={() => { if (!deleting) setConfirmDeleteRoom(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Excluir Sala</h3>
              <button className="modal-close" onClick={() => { if (!deleting) setConfirmDeleteRoom(null) }}>×</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir a sala <strong>{confirmDeleteRoom.room_name}</strong>?</p>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Esta ação não pode ser desfeita. A sala será removida para todos os participantes.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmDeleteRoom(null)} disabled={deleting}>
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteRoom(confirmDeleteRoom.id)}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinCode && (
        <div className="modal-overlay" onClick={() => setShowJoinCode(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sala Privada</h3>
              <button className="modal-close" onClick={() => setShowJoinCode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Digite o código de acesso para entrar na sala <strong>{showJoinCode.room_name}</strong>:</p>
              <div className="form-group">
                <input
                  className="form-control"
                  type="text"
                  maxLength={6}
                  placeholder="Código de 6 dígitos"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              {joinError && <div className="alert alert-error">{joinError}</div>}
              <div className="modal-actions">
                <button className="btn" onClick={() => setShowJoinCode(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleJoinWithCode}>Entrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
