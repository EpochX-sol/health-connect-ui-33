import { Prescription } from '@/types';
import { format } from 'date-fns';

interface PrescriptionPDFProps {
  prescription: Prescription;
  doctorName: string;
  patientName: string;
}

export const PrescriptionPDF = ({ prescription, doctorName, patientName }: PrescriptionPDFProps) => {
  return (
    <div id="prescription-pdf" className="prescription-paper max-w-4xl mx-auto bg-white p-12 shadow-2xl">
      {/* Header */}
      <div className="border-b-4 border-medical-600 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-medical-800">Medical Prescription</h1>
            <p className="text-sm text-muted-foreground mt-2">Telehealth Platform</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Prescription ID</p>
            <p className="text-xs text-muted-foreground font-mono">#{prescription._id.slice(-8).toUpperCase()}</p>
            <p className="text-sm font-semibold mt-2">Date</p>
            <p className="text-xs text-muted-foreground">{format(new Date(prescription.createdAt), 'MMMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Doctor and Patient Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-medical-700 uppercase tracking-wide">Prescribing Physician</h3>
          <div className="bg-medical-50 p-4 rounded-lg">
            <p className="font-semibold text-lg">Dr. {doctorName}</p>
            <p className="text-sm text-muted-foreground">Licensed Medical Professional</p>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-medical-700 uppercase tracking-wide">Patient</h3>
          <div className="bg-accent-50 p-4 rounded-lg">
            <p className="font-semibold text-lg">{patientName}</p>
            <p className="text-sm text-muted-foreground">Patient ID: {prescription.patient_id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Rx Symbol */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-6xl font-serif text-medical-600">℞</span>
          <div className="flex-1 border-t-2 border-medical-200"></div>
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-6 mb-12">
        {prescription.medications.map((med, index) => (
          <div key={index} className="border-l-4 border-medical-600 pl-6 py-3 bg-gray-50 rounded-r">
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="font-semibold text-xl text-foreground">{index + 1}.</span>
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-medical-800">{med.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold">Dosage:</span> {med.dosage}
                  </p>
                </div>
              </div>
              <div className="ml-8 mt-2 bg-white p-3 rounded border border-medical-200">
                <p className="text-sm">
                  <span className="font-semibold text-medical-700">Instructions:</span>{' '}
                  <span className="text-foreground">{med.instructions}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Important Notice */}
      <div className="bg-warning-50 border-l-4 border-warning-600 p-4 mb-8">
        <h4 className="font-bold text-warning-800 mb-2 flex items-center gap-2">
          <span>⚠️</span> Important Notice
        </h4>
        <ul className="text-sm text-warning-900 space-y-1 list-disc list-inside">
          <li>Take medications exactly as prescribed</li>
          <li>Do not share your medication with others</li>
          <li>Contact your doctor if you experience any adverse effects</li>
          <li>Complete the full course of medication unless advised otherwise</li>
        </ul>
      </div>

      {/* Footer / Signature */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground mb-1">This is an electronically generated prescription</p>
            <p className="text-xs text-muted-foreground">Issued through Telehealth Platform</p>
          </div>
          <div className="text-right">
            <div className="border-t-2 border-gray-800 w-64 mb-2"></div>
            <p className="font-semibold">Dr. {doctorName}</p>
            <p className="text-xs text-muted-foreground">Digital Signature</p>
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(prescription.createdAt), 'PPpp')}</p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="text-center mt-8 opacity-20">
        <p className="text-xs font-bold tracking-widest text-medical-600">OFFICIAL MEDICAL PRESCRIPTION</p>
      </div>
    </div>
  );
};

export const printPrescription = () => {
  const printContent = document.getElementById('prescription-pdf');
  if (!printContent) return;

  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Prescription</title>
        <style>
          @page { margin: 20mm; }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .prescription-paper {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
