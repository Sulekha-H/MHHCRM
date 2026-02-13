'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye, User, Calendar, MapPin, Phone, Mail } from 'lucide-react'
import { useClerkSupabaseClient } from '@/lib/supabaseClient'
import { useUser } from '@clerk/nextjs'

export default function ResidentsPage() {
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const { user } = useUser()
  const supabase = useClerkSupabaseClient()

  useEffect(() => {
    if (supabase) {
      loadResidents()
    }
  }, [supabase])

  async function loadResidents() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('Deleted', false)
        .order('Created At', { ascending: false })

      if (error) throw error
      setResidents(data || [])
    } catch (error) {
      console.error('Error loading residents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResidents = residents.filter(resident =>
    `${resident['First Name']} ${resident['Last Name']}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident['Email Address']?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500">Manage and view all resident records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Resident
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search residents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            <Filter size={20} />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Resident</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading residents...
                    </div>
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    No residents found matching your search.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {resident['First Name']?.[0]}{resident['Last Name']?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {resident['First Name']} {resident['Last Name']}
                          </div>
                          <div className="text-sm text-gray-500">ID: {resident.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {resident['Email Address']}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" />
                        {resident['Phone Number']}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        Unit {resident['Unit Number'] || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-600 transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
