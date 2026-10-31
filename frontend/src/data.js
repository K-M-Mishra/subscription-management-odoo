// Mock seed data. Backend aane par sirf store.jsx ke andar API calls se replace karna hai.
export const TAX_RATE = 18 // admin-configurable rule (GST %)
export const money = n => '₹' + Number(n).toLocaleString('en-IN')
export const today = () => new Date().toISOString().slice(0, 10)
const L = (product, qty, price) => ({ product, qty, price })
export const seed = {
  subs: [
    { id:'SUB-1001', customer:'Aarav Traders', plan:'Starter Monthly', cycle:'Monthly', start:'2026-06-01', expiry:'2027-05-31', terms:'Net 15', status:'Active', lines:[L('Billing Suite · Odoo brand',5,1560)] },
    { id:'SUB-1002', customer:'Kiran Retail Pvt Ltd', plan:'Business Yearly', cycle:'Yearly', start:'2026-04-01', expiry:'2027-03-31', terms:'Net 30', status:'Active', lines:[L('Billing Suite · Odoo brand',40,1560), L('Analytics Add-on',40,300)] },
    { id:'SUB-1003', customer:'Meera Foods', plan:'Starter Monthly', cycle:'Monthly', start:'2026-10-20', expiry:'2027-10-19', terms:'Immediate', status:'Confirmed', lines:[L('Billing Suite · Standard',3,1000)] },
    { id:'SUB-1004', customer:'Zenith Logistics', plan:'Business Yearly', cycle:'Yearly', start:'2026-11-05', expiry:'2027-11-04', terms:'Net 30', status:'Quotation', lines:[L('Billing Suite · Odoo brand',25,1560)] },
    { id:'SUB-1005', customer:'Pooja Boutique', plan:'Starter Monthly', cycle:'Monthly', start:'2026-11-01', expiry:'2027-10-31', terms:'Net 15', status:'Draft', lines:[L('Billing Suite · Standard',2,1000)] },
    { id:'SUB-0990', customer:'Old Mill Co', plan:'Starter Monthly', cycle:'Monthly', start:'2025-09-01', expiry:'2026-08-31', terms:'Net 15', status:'Closed', lines:[L('Billing Suite · Standard',4,1000)] },
  ],
  invoices: [
    { id:'INV-0001', subId:'SUB-1001', customer:'Aarav Traders', period:'2026-09', subtotal:7800, disc:0, tax:1404, total:9204, status:'Paid', due:'2026-10-01' },
    { id:'INV-0002', subId:'SUB-1001', customer:'Aarav Traders', period:'2026-10', subtotal:7800, disc:0, tax:1404, total:9204, status:'Confirmed', due:'2026-10-16' },
    { id:'INV-0003', subId:'SUB-1002', customer:'Kiran Retail Pvt Ltd', period:'2026-04', subtotal:74400, disc:3720, tax:12722, total:83402, status:'Confirmed', due:'2026-05-01' },
  ],
  payments: [{ id:'PAY-1', invoiceId:'INV-0001', method:'UPI', amount:9204, date:'2026-09-28', note:'Ref 4471829' }],
  discounts: [
    { id:'DSC-1', name:'Seats 20+ (5%)', type:'%', value:5, minQty:20, start:'2026-01-01', end:'2026-12-31', limit:100, used:12, active:true },
    { id:'DSC-2', name:'Diwali flat ₹500', type:'₹', value:500, minQty:1, start:'2026-10-15', end:'2026-11-15', limit:50, used:50, active:true },
  ],
  products: [
    { id:'P1', name:'Billing Suite', type:'Software', sales:1000, cost:420, notes:'Core product', variants:[{ attr:'Brand', value:'Odoo', extra:560 }, { attr:'Brand', value:'Standard', extra:0 }] },
    { id:'P2', name:'Analytics Add-on', type:'Add-on', sales:300, cost:90, notes:'Switch on/off anytime', variants:[] },
  ],
  plans: [
    { id:'PL1', name:'Starter Monthly', price:1000, cycle:'Monthly', minQty:1, from:'2026-01-01', to:'2027-12-31', autoClose:true, pausable:true, renewable:true, closable:true },
    { id:'PL2', name:'Business Yearly', price:12000, cycle:'Yearly', minQty:10, from:'2026-01-01', to:'2027-12-31', autoClose:false, pausable:false, renewable:true, closable:true },
  ],
  revenue: [['May',182],['Jun',214],['Jul',236],['Aug',251],['Sep',289],['Oct',318]], // ₹ thousands
}
