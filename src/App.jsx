import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [view, setView] = useState('list') // list, add, inventory, detail
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  // フォーム状態
  const [newItem, setNewItem] = useState({ name: '', unit: '個', min_quantity: 0, inventory_order: 0 })
  const [transactionForm, setTransactionForm] = useState({ item_id: '', type: 'in', quantity: 0, note: '' })
  const [inventoryData, setInventoryData] = useState({})

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: itemsData, error: itemsError } = await supabase.from('items').select('*').order('id')
      if (itemsError) {
        throw new Error('データベースに接続できません。テーブルが作成されているか確認してください。')
      }
      
      const { data: transactionsData, error: transError } = await supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false })
      if (transError) {
        throw new Error('トランザクションテーブルに接続できません。')
      }
      
      setItems(itemsData || [])
      setTransactions(transactionsData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 品目追加
  const addItem = async (e) => {
    e.preventDefault()
    
    if (!newItem.name || newItem.name.trim() === '') {
      alert('品目名を入力してください')
      return
    }
    
    const insertData = {
      name: newItem.name.trim(),
      unit: newItem.unit || '個',
      min_quantity: parseInt(newItem.min_quantity) || 0,
      inventory_order: parseInt(newItem.inventory_order) || 0,
      current_quantity: 0
    }
    
    const { error } = await supabase
      .from('items')
      .insert([insertData])
    
    if (error) {
      alert('エラー: ' + error.message)
      return
    }
    
    setNewItem({ name: '', unit: '個', min_quantity: 0, inventory_order: 0 })
    await loadData()
    setView('list')
  }

  // 入出庫処理
  const handleTransaction = async (e) => {
    e.preventDefault()
    
    const itemId = parseInt(transactionForm.item_id)
    const quantity = parseFloat(transactionForm.quantity)
    
    if (isNaN(itemId) || isNaN(quantity) || quantity <= 0) {
      alert('正しい数量を入力してください')
      return
    }
    
    const item = items.find(i => i.id === itemId)
    if (!item) {
      alert('品目が見つかりません')
      return
    }

    let newQuantity = item.current_quantity
    if (transactionForm.type === 'in') {
      newQuantity += quantity
    } else if (transactionForm.type === 'out') {
      newQuantity -= quantity
      if (newQuantity < 0) {
        alert('在庫数が不足しています')
        return
      }
    }

    try {
      // トランザクション記録
      const { error: transError } = await supabase.from('inventory_transactions').insert([{
        item_id: itemId,
        type: transactionForm.type,
        quantity: quantity,
        note: transactionForm.note || ''
      }])
      if (transError) throw transError

      // 在庫数更新
      const { error: updateError } = await supabase.from('items').update({ current_quantity: newQuantity }).eq('id', itemId)
      if (updateError) throw updateError

      setTransactionForm({ item_id: '', type: 'in', quantity: 0, note: '' })
      loadData()
      setView('list')
    } catch (error) {
      alert('エラー: ' + error.message)
    }
  }

  // 棚卸一括更新
  const handleInventory = async (e) => {
    e.preventDefault()
    
    try {
      for (const [itemId, quantity] of Object.entries(inventoryData)) {
        const qty = parseFloat(quantity)
        if (isNaN(qty) || qty < 0) continue
        
        const item = items.find(i => i.id === parseInt(itemId))
        if (!item) continue

        // トランザクション記録
        const { error: transError } = await supabase.from('inventory_transactions').insert([{
          item_id: parseInt(itemId),
          type: 'adjustment',
          quantity: qty,
          note: '棚卸'
        }])
        if (transError) throw transError

        // 在庫数更新
        const { error: updateError } = await supabase.from('items').update({ current_quantity: qty }).eq('id', item.id)
        if (updateError) throw updateError
      }
      
      setInventoryData({})
      loadData()
      setView('list')
    } catch (error) {
      alert('エラー: ' + error.message)
    }
  }

  // 在庫日数の計算（簡易版：平均出庫量から推定）
  const calculateDays = (itemId) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return null
    
    const itemTransactions = transactions.filter(t => t.item_id === itemId && t.type === 'out')
    if (itemTransactions.length === 0) return null
    const totalOut = itemTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const avgPerDay = totalOut / 30 // 簡易的に30日で割る
    if (avgPerDay === 0) return null
    return Math.round(item.current_quantity / avgPerDay)
  }

  // アラート色の判定
  const getAlertColor = (item) => {
    if (item.current_quantity <= 0) return '#ff4444' // 赤：切迫
    if (item.current_quantity <= item.min_quantity) return '#ff8800' // 橙：注意
    const days = calculateDays(item.id)
    if (days !== null && days < 7) return '#ffaa00' // 黄：残り少ない
    return '#4caf50' // 緑：正常
  }

  // 棚卸順でソート
  const inventorySortedItems = [...items].sort((a, b) => a.inventory_order - b.inventory_order)

  // アイテム詳細表示
  const showItemDetail = (item) => {
    setSelectedItem(item)
    setView('detail')
  }

  if (loading) {
    return <div className="loading">読み込み中...</div>
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>⚠️ エラーが発生しました</h1>
        <p>{error}</p>
        <button onClick={loadData} className="primary">再試行</button>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📦 在庫管理</h1>
        <nav className="nav">
          <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>一覧</button>
          <button onClick={() => setView('add')} className={view === 'add' ? 'active' : ''}>品目追加</button>
          <button onClick={() => setView('inventory')} className={view === 'inventory' ? 'active' : ''}>棚卸</button>
        </nav>
      </header>

      <main className="main">
        {view === 'list' && (
          <div className="list-view">
            <h2>在庫一覧</h2>
            {items.length === 0 ? (
              <p className="empty">品目がありません。まずは品目を追加してください。</p>
            ) : (
              <div className="table-container">
                <table className="item-table">
                  <thead>
                    <tr>
                      <th>品目名</th>
                      <th>現在在庫</th>
                      <th>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} onClick={() => showItemDetail(item)} className="table-row">
                        <td>{item.name}</td>
                        <td className="quantity-cell">{item.current_quantity} {item.unit}</td>
                        <td>
                          <span className="status-badge" style={{ background: getAlertColor(item) }}>
                            {item.current_quantity <= 0 ? '切迫' : item.current_quantity <= item.min_quantity ? '注意' : '正常'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedItem && (
          <div className="detail-view">
            <h2>アイテム詳細</h2>
            <div className="detail-card">
              <div className="detail-header">
                <h3>{selectedItem.name}</h3>
                <span className="quantity-badge">{selectedItem.current_quantity} {selectedItem.unit}</span>
              </div>
              
              <div className="detail-info">
                <div className="info-row">
                  <span className="info-label">ID:</span>
                  <span className="info-value">{selectedItem.id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">最小在庫数:</span>
                  <span className="info-value">{selectedItem.min_quantity}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">棚卸順:</span>
                  <span className="info-value">{selectedItem.inventory_order}</span>
                </div>
                {calculateDays(selectedItem.id) !== null && (
                  <div className="info-row">
                    <span className="info-label">在庫日数:</span>
                    <span className="info-value">約{calculateDays(selectedItem.id)}日</span>
                  </div>
                )}
              </div>

              <div className="detail-actions">
                <button onClick={() => { setTransactionForm({ ...transactionForm, item_id: selectedItem.id, type: 'in' }); setView('transaction') }} className="action-btn in-btn">
                  入庫
                </button>
                <button onClick={() => { setTransactionForm({ ...transactionForm, item_id: selectedItem.id, type: 'out' }); setView('transaction') }} className="action-btn out-btn">
                  出庫
                </button>
                <button onClick={() => setView('list')} className="action-btn back-btn">
                  戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="form-view">
            <h2>品目追加</h2>
            <form onSubmit={addItem}>
              <div className="form-group">
                <label>品目名 *</label>
                <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>単位</label>
                <input type="text" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
              </div>
              <div className="form-group">
                <label>アラート閾値</label>
                <input type="number" value={newItem.min_quantity} onChange={e => setNewItem({ ...newItem, min_quantity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>棚卸順（数字、小さい順）</label>
                <input type="number" value={newItem.inventory_order} onChange={e => setNewItem({ ...newItem, inventory_order: parseInt(e.target.value) || 0 })} />
              </div>
              <button type="submit" className="primary">追加</button>
              <button type="button" onClick={() => setView('list')}>キャンセル</button>
            </form>
          </div>
        )}

        {view === 'transaction' && (
          <div className="form-view">
            <h2>{transactionForm.type === 'in' ? '入庫' : '出庫'}</h2>
            <form onSubmit={handleTransaction}>
              <div className="form-group">
                <label>品目</label>
                <input type="text" value={items.find(i => i.id === parseInt(transactionForm.item_id))?.name || ''} disabled />
              </div>
              <div className="form-group">
                <label>数量 *</label>
                <input type="number" value={transactionForm.quantity} onChange={e => setTransactionForm({ ...transactionForm, quantity: parseFloat(e.target.value) || 0 })} required min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>メモ</label>
                <input type="text" value={transactionForm.note} onChange={e => setTransactionForm({ ...transactionForm, note: e.target.value })} />
              </div>
              <button type="submit" className="primary">実行</button>
              <button type="button" onClick={() => setView('list')}>キャンセル</button>
            </form>
          </div>
        )}

        {view === 'inventory' && (
          <div className="inventory-view">
            <h2>棚卸</h2>
            <form onSubmit={handleInventory}>
              {inventorySortedItems.map(item => (
                <div key={item.id} className="inventory-row">
                  <label>{item.name}（帳簿: {item.current_quantity} {item.unit}）</label>
                  <input
                    type="number"
                    value={inventoryData[item.id] || ''}
                    onChange={e => setInventoryData({ ...inventoryData, [item.id]: e.target.value })}
                    placeholder="実在庫数を入力"
                  />
                </div>
              ))}
              <button type="submit" className="primary">棚卸完了</button>
              <button type="button" onClick={() => setView('list')}>キャンセル</button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default App