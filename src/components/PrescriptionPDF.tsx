import { Prescription } from '@/types';
import { format } from 'date-fns';

interface PrescriptionPDFProps {
  prescription: Prescription;
  doctorName: string;
  patientName: string;
}

export const PrescriptionPDF = ({ prescription, doctorName, patientName }: PrescriptionPDFProps) => {
  return (
    <div 
      id="prescription-pdf" 
      style={{
        padding: '48px',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        maxWidth: '900px',
        margin: '0 auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
      }}
    >
      {/* Header with Medical Theme */}
      <div 
        style={{
          borderBottom: '4px solid #0066cc',
          paddingBottom: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#003d99',
            margin: 0,
            marginBottom: '8px'
          }}>
            Medical Prescription
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#666',
            margin: 0,
            marginTop: '8px'
          }}>
            Digital Healthcare Platform
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '600',
            margin: 0,
            color: '#333'
          }}>
            Prescription ID
          </p>
          <p style={{
            fontSize: '12px',
            color: '#666',
            fontFamily: 'monospace',
            margin: '4px 0'
          }}>
            #{prescription._id.slice(-8).toUpperCase()}
          </p>
          <p style={{
            fontSize: '13px',
            fontWeight: '600',
            margin: '16px 0 4px 0',
            color: '#333'
          }}>
            Date
          </p>
          <p style={{
            fontSize: '12px',
            color: '#666',
            margin: 0
          }}>
            {format(new Date(prescription.createdAt), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* Doctor and Patient Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginBottom: '32px'
      }}>
        <div>
          <h3 style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#003d99',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0,
            marginBottom: '12px'
          }}>
            Prescribing Physician
          </h3>
          <div style={{
            backgroundColor: '#f0f4ff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #d9e4ff'
          }}>
            <p style={{
              fontWeight: '600',
              fontSize: '18px',
              margin: 0,
              color: '#003d99'
            }}>
              Dr. {doctorName}
            </p>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: '4px 0 0 0'
            }}>
              Licensed Medical Professional
            </p>
          </div>
        </div>
        <div>
          <h3 style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#003d99',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: 0,
            marginBottom: '12px'
          }}>
            Patient Information
          </h3>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{
              fontWeight: '600',
              fontSize: '18px',
              margin: 0,
              color: '#333'
            }}>
              {patientName}
            </p>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: '4px 0 0 0'
            }}>
              Patient ID: {prescription.patient_id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Rx Symbol Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <span style={{
          fontSize: '48px',
          fontFamily: 'Georgia, serif',
          color: '#0066cc',
          lineHeight: 1
        }}>
          ℞
        </span>
        <div style={{
          flex: 1,
          borderTop: '2px solid #ccc'
        }}></div>
      </div>

      {/* Medications Section */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#003d99',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '2px solid #0066cc',
          paddingBottom: '12px',
          marginBottom: '24px'
        }}>
          Medications
        </h2>
        
        <div>
          {prescription.medications.map((med, index) => (
            <div 
              key={index} 
              style={{
                borderLeft: '4px solid #0066cc',
                paddingLeft: '20px',
                paddingTop: '12px',
                paddingBottom: '12px',
                marginBottom: '20px',
                backgroundColor: '#fafafa',
                paddingRight: '16px',
                borderRadius: '0 4px 4px 0'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontWeight: '600',
                  fontSize: '18px',
                  color: '#333'
                }}>
                  {index + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    color: '#003d99',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {med.name}
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: '#666',
                    margin: 0
                  }}>
                    <span style={{ fontWeight: '600' }}>Strength:</span> {med.dosage}
                  </p>
                </div>
              </div>
              <div style={{
                marginLeft: '32px',
                marginTop: '12px',
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                <p style={{
                  fontSize: '13px',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  <span style={{ fontWeight: '600', color: '#003d99' }}>Instructions: </span>
                  <span style={{ color: '#333' }}>{med.instructions}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Safety Notice */}
      <div style={{
        backgroundColor: '#fffbf0',
        border: '1px solid #ffc107',
        borderLeft: '4px solid #ffc107',
        padding: '16px',
        marginBottom: '32px',
        borderRadius: '4px'
      }}>
        <h4 style={{
          fontWeight: '700',
          color: '#ff8800',
          margin: 0,
          marginBottom: '12px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚠️ Important Safety Notice
        </h4>
        <ul style={{
          fontSize: '13px',
          color: '#666',
          margin: 0,
          paddingLeft: '20px',
          lineHeight: '1.6'
        }}>
          <li>Take medications exactly as prescribed by your doctor</li>
          <li>Do not share your medication with others</li>
          <li>Contact your doctor immediately if you experience any adverse effects</li>
          <li>Complete the full course of medication unless advised otherwise</li>
        </ul>
      </div>

      {/* Signature Section */}
      <div style={{
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: '2px solid #ccc'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <div>
            <p style={{
              fontSize: '12px',
              color: '#666',
              margin: '0 0 4px 0'
            }}>
              This is an electronically generated prescription
            </p>
            <p style={{
              fontSize: '12px',
              color: '#666',
              margin: 0
            }}>
              Issued through Digital Healthcare Platform
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              borderTop: '2px solid #333',
              width: '200px',
              marginBottom: '8px'
            }}></div>
            <p style={{
              fontWeight: '600',
              margin: 0,
              color: '#333'
            }}>
              Dr. {doctorName}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#666',
              margin: '4px 0 0 0'
            }}>
              Digital Signature
            </p>
            <p style={{
              fontSize: '12px',
              color: '#666',
              margin: '4px 0 0 0'
            }}>
              {format(new Date(prescription.createdAt), 'PPpp')}
            </p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        opacity: 0.15
      }}>
        <p style={{
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '2px',
          color: '#0066cc',
          margin: 0
        }}>
          OFFICIAL MEDICAL PRESCRIPTION
        </p>
      </div>
    </div>
  );
};

export const printPrescription = () => {
  const printContent = document.getElementById('prescription-pdf');
  if (!printContent) return;

  const printWindow = window.open('', '', 'width=900,height=1000');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Prescription</title>
        <style>
          @page { 
            size: A4;
            margin: 20mm; 
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          @media print {
            body { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact;
              -webkit-filter: none;
              filter: none;
            }
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

export const downloadPrescriptionPDF = () => {
  // Use browser's print dialog for PDF download
  printPrescription();
};
