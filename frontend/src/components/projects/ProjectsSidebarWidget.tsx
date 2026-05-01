import { Folder, Settings, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Project } from '@/lib/api/projects'
import { useProjects, useDeleteProject } from '@/lib/hooks/useProjects'

const font = 'Inter, Segoe UI, sans-serif'

export function ProjectsSidebarWidget() {
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects(6, 0)
  const deleteProject = useDeleteProject()

  const visible = projects.slice(0, 5)
  const hasMore = projects.length > 5

  const handleDelete = (project: Project) => {
    if (!window.confirm(`Delete "${project.project_name}"?`)) return
    deleteProject.mutate(project.project_id)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4F46E5, #1E293B)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFFFFF' }}>
          <Folder size={14} />
          <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: font }}>Projects</span>
        </div>
        <button
          onClick={() => navigate('/projects/new')}
          title="New project"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.8)',
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: '12px 16px', fontSize: '12px', color: '#9CA3AF', fontFamily: font }}>
          Loading…
        </div>
      ) : visible.length === 0 ? (
        <div style={{ padding: '12px 16px', fontSize: '12px', color: '#9CA3AF', fontFamily: font }}>
          No projects yet
        </div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {visible.map((project) => (
            <ProjectRow
              key={project.project_id}
              project={project}
              onEdit={() => navigate(`/projects/${project.project_id}/edit`)}
              onDelete={() => handleDelete(project)}
            />
          ))}
        </ul>
      )}

      {/* View more */}
      {hasMore && (
        <div
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            color: '#6366F1',
            cursor: 'pointer',
            fontFamily: font,
            borderTop: '1px solid #F3F4F6',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4F46E5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6366F1')}
        >
          View more ↓
        </div>
      )}
    </div>
  )
}

function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 16px',
        borderBottom: '1px solid #F3F4F6',
        fontSize: '13px',
        color: '#374151',
        fontFamily: font,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <Settings size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
      <span
        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={project.project_name}
      >
        {project.project_name}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); onEdit() }}
        title="Edit"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: '12px', lineHeight: 1, padding: '1px 3px', flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#6366F1')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
      >
        ✏️
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Delete"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9CA3AF', fontSize: '14px', lineHeight: 1, padding: '1px 3px', flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
      >
        ×
      </button>
    </li>
  )
}
