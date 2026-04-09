'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    loadUsers()
  }, [])

  // ค้นหา
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users)
    } else {
      const q = search.toLowerCase()
      setFiltered(users.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      ))
    }
    setPage(1)
  }, [search, users])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <AuthLayout requiredRole="admin">
      <h1 className="text-2xl font-bold mb-6">จัดการผู้ใช้งาน</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <p className="text-sm text-gray-500 mb-4">ทั้งหมด {filtered.length} คน</p>

      {loading ? (
        <p className="text-gray-500">กำลังโหลด...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-500">ไม่พบผู้ใช้งาน</p>
        </div>
      ) : (
        <>
          {/* ตาราง */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ชื่อผู้ใช้</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">อีเมล</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">สถานะ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">วันที่สมัคร</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:text-gray-300 hover:bg-gray-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-gray-600">
                หน้า {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:text-gray-300 hover:bg-gray-50"
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Card บนมือถือ */}
          <div className="md:hidden space-y-3">
            {paginated.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                  <Link href={`/admin/users/${user.id}`} className="text-sm text-blue-600 hover:underline">
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AuthLayout>
  )
}
