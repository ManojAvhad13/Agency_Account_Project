// File: src/App.jsx
import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

function App() {
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem('entries')) || []);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses')) || []);
  const [mainDate, setMainDate] = useState(() => localStorage.getItem('mainDate') || '');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [editExpenseData, setEditExpenseData] = useState({});

  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('mainDate', mainDate);
  }, [entries, expenses, mainDate]);

  const addEntry = (entry) => {
    setEntries([...entries, { ...entry, date: mainDate }]);
  };

  const addExpense = (expense) => {
    setExpenses([...expenses, { ...expense, date: mainDate }]);
  };

  const deleteEntry = (index) => setEntries(entries.filter((_, i) => i !== index));
  const deleteExpense = (index) => setExpenses(expenses.filter((_, i) => i !== index));

  const editEntry = (index) => {
    setEditingIndex(index);
    setEditData(entries[index]);
  };

  const saveEditedEntry = () => {
    const updated = [...entries];
    updated[editingIndex] = { ...editData, date: mainDate };
    setEntries(updated);
    setEditingIndex(null);
    setEditData({});
  };

  const editExpense = (index) => {
    setEditingExpenseIndex(index);
    setEditExpenseData(expenses[index]);
  };

  const saveEditedExpense = () => {
    const updated = [...expenses];
    updated[editingExpenseIndex] = { ...editExpenseData, date: mainDate };
    setExpenses(updated);
    setEditingExpenseIndex(null);
    setEditExpenseData({});
  };

  const totalCylinders = entries.reduce((sum, e) => sum + +e.cylinders, 0);
  const totalIncome = entries.reduce((sum, e) => sum + (+e.cylinders * +e.price), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + +e.amount, 0);
  const finalBalance = totalIncome - totalExpenses;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(entries), 'Sales');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), 'Expenses');
    XLSX.writeFile(wb, 'GasAgency_Report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Gas Agency Daily Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date: ${mainDate}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Cylinders', 'Price', 'Note']],
      body: entries.map(e => [e.date, e.cylinders, e.price, e.note]),
      theme: 'striped'
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Date', 'Expense Name', 'Amount']],
      body: expenses.map(e => [e.date, e.name, e.amount]),
      theme: 'striped'
    });

    doc.text(`Total Cylinders: ${totalCylinders}`, 14, doc.lastAutoTable.finalY + 20);
    doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 28);
    doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 36);
    doc.text(`Final Balance: ₹${finalBalance.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 44);

    doc.save('GasAgency_Report.pdf');
  };

  return (
    <div className="container">
      <h1>🛢️ SWARA INDANE GAS AGENCY</h1>
      <div className="main-date">
        <label>Date:</label>
        <input type="date" value={mainDate} onChange={(e) => setMainDate(e.target.value)} />
      </div>

      <div className="forms">
        <form onSubmit={e => { e.preventDefault(); addEntry({ cylinders: +e.target.cylinders.value, price: +e.target.price.value, note: e.target.note.value }); e.target.reset(); }} className="form-box">
          <h2>Add Sale Entry</h2>
          <input name="cylinders" type="number" placeholder="Number of Cylinders" required />
          <input name="price" type="number" placeholder="Price per Cylinder" required />
          <input name="note" type="text" placeholder="Note (e.g., PhonePe, Customer)" />
          <button className="btn blue">Add Entry</button>
        </form>

        <form onSubmit={e => { e.preventDefault(); addExpense({ name: e.target.name.value, amount: +e.target.amount.value }); e.target.reset(); }} className="form-box">
          <h2>Add Expense</h2>
          <input name="name" type="text" placeholder="Expense Name" required />
          <input name="amount" type="number" placeholder="Amount" required />
          <button className="btn red">Add Expense</button>
        </form>
      </div>

      <div className="summary">
        <h2>Summary</h2>
        <p>Total Cylinders: {totalCylinders}</p>
        <p>Total Income: ₹{totalIncome.toFixed(2)}</p>
        <p>Total Expenses: ₹{totalExpenses.toFixed(2)}</p>
        <p className="bold">Final Balance: ₹{finalBalance.toFixed(2)}</p>
      </div>

      <div className="entry-list">
        <h2>Sale Entries</h2>
        <ul>
          {entries.map((e, i) => (
            <li key={i}>
              {editingIndex === i ? (
                <>
                  <input value={editData.cylinders} onChange={(ev) => setEditData({ ...editData, cylinders: ev.target.value })} />
                  <input value={editData.price} onChange={(ev) => setEditData({ ...editData, price: ev.target.value })} />
                  <input value={editData.note} onChange={(ev) => setEditData({ ...editData, note: ev.target.value })} />
                  <button onClick={saveEditedEntry}>Save</button>
                </>
              ) : (
                <>
                  {e.cylinders} cylinders × ₹{e.price} = ₹{e.cylinders * e.price} → {e.note}
                  <button className='edit-btn' onClick={() => editEntry(i)}>Edit</button>
                  <button className='delete-btn' onClick={() => deleteEntry(i)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>

        <h2>Expenses</h2>
        <ul>
          {expenses.map((e, i) => (
            <li key={i}>
              {editingExpenseIndex === i ? (
                <>
                  <input value={editExpenseData.name} onChange={(ev) => setEditExpenseData({ ...editExpenseData, name: ev.target.value })} />
                  <input value={editExpenseData.amount} onChange={(ev) => setEditExpenseData({ ...editExpenseData, amount: ev.target.value })} />
                  <button onClick={saveEditedExpense}>Save</button>
                </>
              ) : (
                <>
                  {e.name}: ₹{e.amount}
                  <button className='edit-btn' onClick={() => editExpense(i)}>Edit</button>
                  <button className='delete-btn' onClick={() => deleteExpense(i)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="actions">
        <button onClick={exportToExcel} className="btn green">Export to Excel</button>
        <button onClick={exportToPDF} className="btn purple">Export to PDF</button>
      </div>
    </div>
  );
}

export default App;