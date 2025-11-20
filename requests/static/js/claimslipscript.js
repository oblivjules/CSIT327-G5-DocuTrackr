const claimSlipData = {
  claim_number: "CLAIM-3-1760509983425",
  date_ready: "10/15/2025",
  student_name: "John Doe",
  student_id: "2024-001",
  doc_type: "Diploma Copy",
  total_amount: "₱150",
  copies: 1,
};


document.getElementById("claimNumber").textContent = claimSlipData.claim_number;
document.getElementById("dateReady").textContent = claimSlipData.date_ready;
document.getElementById("studentName").textContent = claimSlipData.student_name;
document.getElementById("studentId").textContent = claimSlipData.student_id;
document.getElementById("docType").textContent = claimSlipData.doc_type;
document.getElementById("amount").textContent = claimSlipData.total_amount;
document.getElementById("copies").textContent = claimSlipData.copies;


function printClaimSlip() {
  window.print();
}
