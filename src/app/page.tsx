


// 'use client';
// import { useState } from 'react';
// import Head from 'next/head';
// import { FaUpload, FaSearch, FaInfoCircle } from 'react-icons/fa';
// import { LuFileJson } from 'react-icons/lu';
// import { BiErrorCircle } from 'react-icons/bi';
// import { MdOutlineDocumentScanner } from 'react-icons/md';


// interface Answer {
//   Decision: 'Approved' | 'Rejected';
//   Amount: number | null;
//   Justification: string[];
// }

// interface HackRxResponse {
//   answers: Answer[];
//   error?: string;
// }

// export default function App() {
//   const [documentUrl, setDocumentUrl] = useState('');
//   const [questions, setQuestions] = useState('');
//   const [result, setResult] = useState<HackRxResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error' | 'submitting'>('idle');
//   const [rawResponse, setRawResponse] = useState<unknown>(null);

//   const handleSubmit = async () => {
//     if (!documentUrl || !questions) {
//       alert('Please provide a document URL and at least one question.');
//       return;
//     }

//     setIsLoading(true);
//     setSubmissionStatus('submitting');
//     setResult(null);
//     setRawResponse(null);

//     const questionArray = questions.split('\n').filter(q => q.trim() !== '');

//     try {
//       const response = await fetch('/api/hackerx/run', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           // The auth token would be passed here if required by the API
//           'Authorization': 'Bearer 6b4457cc45bb8b797a89d7e440c29c41f7a71a3069f1cccc2b614d2946073afb',
//         },
//         body: JSON.stringify({
//           documents: documentUrl,
//           questions: questionArray,
//         }),
//       });

//       const data = await response.json();
//       setRawResponse(data);

//       if (response.ok) {
//         setResult(data);
//         setSubmissionStatus('success');
//       } else {
//         setSubmissionStatus('error');
//         setResult({
//           answers: [{
//             Decision: 'Rejected',
//             Amount: null,
//             Justification: [data.error || 'An unexpected error occurred during submission.'],
//           }],
//         });
//       }
//     } catch (error) {
//       console.error('Submission error:', error);
//       setSubmissionStatus('error');
//       setResult({
//         answers: [{
//           Decision: 'Rejected',
//           Amount: null,
//           Justification: ['A network or system error occurred. Please check the console.'],
//         }],
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center">
//       <Head>
//         <title>HackRx RAG System</title>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       </Head>

//       <div className="bg-gray-900 w-full shadow-lg">
//         <div className="container mx-auto px-4 py-6 max-w-6xl">
//           <div className="flex items-center justify-between">
//             <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
//               HackRx RAG System
//             </h1>
//             <p className="text-gray-400 text-sm hidden sm:block">AI-powered Policy Analysis</p>
//           </div>
//         </div>
//       </div>

//       <main className="container mx-auto px-4 py-12 max-w-6xl w-full">
//         <div className="grid lg:grid-cols-2 gap-10">
//           {/* Left Column - Input Section */}
//           <div className="space-y-8">
//             {/* Document URL Input */}
//             <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
//               <div className="p-6 border-b border-gray-700">
//                 <h2 className="text-xl font-semibold text-white flex items-center gap-2">
//                   <FaUpload className="text-blue-400" />
//                   Document URL
//                 </h2>
//                 <p className="text-gray-400 text-sm mt-1">
//                   Enter the URL of the PDF, DOCX, or EML document to analyze.
//                 </p>
//               </div>
//               <div className="p-6">
//                 <input
//                   type="text"
//                   value={documentUrl}
//                   onChange={(e) => setDocumentUrl(e.target.value)}
//                   placeholder="e.g., https://example.com/policy.pdf"
//                   className="w-full px-5 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
//                 />
//               </div>
//             </div>

//             {/* Questions Input */}
//             <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
//               <div className="p-6 border-b border-gray-700">
//                 <h2 className="text-xl font-semibold text-white flex items-center gap-2">
//                   <FaSearch className="text-green-400" />
//                   Enter Questions
//                 </h2>
//                 <p className="text-gray-400 text-sm mt-1">
//                   Enter one or more questions, each on a new line.
//                 </p>
//               </div>
//               <div className="p-6">
//                 <textarea
//                   value={questions}
//                   onChange={(e) => setQuestions(e.target.value)}
//                   placeholder="e.g., 
// What is the waiting period for pre-existing diseases?
// Does this policy cover maternity expenses?
// What is the coverage amount for knee surgery?"
//                   rows={6}
//                   className="w-full px-5 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors resize-none"
//                 />
//               </div>
//             </div>

//             {/* Submit Button */}
//             <div className="w-full">
//               <button
//                 onClick={handleSubmit}
//                 disabled={isLoading || !documentUrl || !questions}
//                 className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 transition-all font-bold text-lg"
//               >
//                 {isLoading ? (
//                   <span className="flex items-center justify-center">
//                     <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
//                     Processing...
//                   </span>
//                 ) : (
//                   'Run Analysis'
//                 )}
//               </button>
//             </div>
//           </div>

//           {/* Right Column - Results Section */}
//           <div className="space-y-8">
//             {submissionStatus === 'idle' && (
//               <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex items-center justify-center h-full p-8">
//                 <div className="text-center">
//                   <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <FaInfoCircle className="text-gray-400 text-3xl" />
//                   </div>
//                   <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
//                   <p className="text-gray-400">
//                     Provide a document URL and a list of questions to get started.
//                   </p>
//                 </div>
//               </div>
//             )}
            
//             {submissionStatus === 'submitting' && (
//               <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex items-center justify-center h-full p-8">
//                 <div className="text-center">
//                   <div className="animate-spin w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
//                   <h3 className="text-xl font-semibold text-white mb-2">Analyzing Documents...</h3>
//                   <p className="text-gray-400">This may take up to 30 seconds.</p>
//                 </div>
//               </div>
//             )}

//             {submissionStatus === 'error' && result && (
//               <div className="bg-gray-800 border border-red-600 rounded-2xl shadow-xl p-8">
//                 <div className="flex items-center mb-4">
//                   <BiErrorCircle className="text-red-500 text-3xl mr-3" />
//                   <h3 className="text-xl font-semibold text-red-400">Submission Failed</h3>
//                 </div>
//                 <div className="text-gray-300">
//                   <p>{result?.answers?.[0]?.Justification?.[0] || 'An unknown error occurred.'}</p>
//                 </div>
//               </div>
//             )}

//             {submissionStatus === 'success' && result && (
//               <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
//                 <div className="p-6 border-b border-gray-700">
//                   <h2 className="text-xl font-semibold text-white flex items-center gap-2">
//                     <MdOutlineDocumentScanner className="text-blue-400" />
//                     Analysis Results
//                   </h2>
//                 </div>
//                 <div className="p-6 space-y-6">
//                   {result.answers.map((answer, index) => (
//                     <div key={index} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
//                       <div className="flex items-center space-x-4 mb-4">
//                         <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-gray-300 bg-gray-700">
//                           {index + 1}
//                         </span>
//                         <div className="flex-grow">
//                           <h4 className="font-semibold text-lg text-white">
//                             Question:
//                           </h4>
//                           <p className="text-gray-300 text-sm">{questions.split('\n')[index]}</p>
//                         </div>
//                       </div>
//                       <div className={`p-4 rounded-xl border-2 ${
//                         answer.Decision === 'Approved' 
//                           ? 'bg-green-950 border-green-600' 
//                           : 'bg-red-950 border-red-600'
//                       }`}>
//                         <div className="flex items-center space-x-3">
//                           <div className={`w-3 h-3 rounded-full ${
//                             answer.Decision === 'Approved' ? 'bg-green-500' : 'bg-red-500'
//                           }`}></div>
//                           <div>
//                             <h3 className="text-lg font-medium text-white">
//                               Decision: <span className={answer.Decision === 'Approved' ? 'text-green-400' : 'text-red-400'}>
//                                 {answer.Decision}
//                               </span>
//                             </h3>
//                             {answer.Amount !== null && (
//                               <p className="text-gray-300 text-sm mt-1">
//                                 Coverage Amount: <span className="text-green-400">₹{answer.Amount.toLocaleString()}</span>
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="mt-4 bg-gray-800 p-4 rounded-xl">
//                         <h4 className="font-medium text-white mb-2">Justification:</h4>
//                         <ul className="space-y-2 text-gray-300 text-sm">
//                           {answer.Justification.map((reason, jIndex) => (
//                             <li key={jIndex} className="flex items-start">
//                               <span className="w-1 h-1 bg-blue-400 rounded-full mt-2.5 mr-2 flex-shrink-0"></span>
//                               <span>{reason}</span>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
                
//                 {/* Raw JSON Details */}
//                 <details className="bg-gray-900 border-t border-gray-700 mt-6">
//                   <summary className="cursor-pointer p-4 font-medium text-gray-300 flex items-center hover:bg-gray-800 transition-colors">
//                     <LuFileJson className="mr-2" />
//                     View Raw JSON Response
//                   </summary>
//                   <div className="p-4 pt-0">
//                     <pre className="bg-black text-green-400 p-4 rounded-xl text-xs overflow-auto font-mono border border-gray-700">
//                       {JSON.stringify(rawResponse, null, 2)}
//                     </pre>
//                   </div>
//                 </details>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }

'use client';
import { useState } from 'react';
import Head from 'next/head';
import { FaUpload, FaSearch, FaInfoCircle } from 'react-icons/fa';
import { LuFileJson } from 'react-icons/lu';
import { BiErrorCircle } from 'react-icons/bi';
import { MdOutlineDocumentScanner } from 'react-icons/md';

// interface HackRxRequest {
//   documents: string;
//   questions: string[];
// }

interface HackRxResponse {
  answers: string[];
  error?: string;
}

export default function App() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [questions, setQuestions] = useState('');
  const [result, setResult] = useState<HackRxResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error' | 'submitting'>('idle');
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  const loadSampleData = () => {
    setDocumentUrl('https://hackrx.blob.core.windows.net/assets/policy.pdf?sv=2023-01-03&st=2025-07-04T09%3A11%3A24Z&se=2027-07-05T09%3A11%3A00Z&sr=b&sp=r&sig=N4a9OU0w0QXO6AOIBiu4bpl7AXvEZogeT%2FjUHNO7HzQ%3D');
    setQuestions(`What is the grace period for premium payment under the National Parivar Mediclaim Plus Policy?
What is the waiting period for pre-existing diseases (PED) to be covered?
Does this policy cover maternity expenses, and what are the conditions?
What is the waiting period for cataract surgery?
Are the medical expenses for an organ donor covered under this policy?`);
  };

  const handleSubmit = async () => {
    if (!documentUrl || !questions) {
      alert('Please provide a document URL and at least one question.');
      return;
    }

    setIsLoading(true);
    setSubmissionStatus('submitting');
    setResult(null);
    setRawResponse(null);

    const questionArray = questions.split('\n').filter(q => q.trim() !== '');

    try {
      const response = await fetch('/api/v1/hackrx/run', {  // Updated endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer 6b4457cc45bb8b797a89d7e440c29c41f7a71a3069f1cccc2b614d2946073afb',
        },
        body: JSON.stringify({
          documents: documentUrl,
          questions: questionArray,
        }),
      });

      const data = await response.json();
      setRawResponse(data);

      if (response.ok) {
        setResult(data);
        setSubmissionStatus('success');
      } else {
        setSubmissionStatus('error');
        setResult({
          answers: [data.error || 'An unexpected error occurred during submission.'],
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      setResult({
        answers: ['A network or system error occurred. Please check the console.'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center">
      <Head>
        <title>HackRx 6.0 - Document Query System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="bg-gray-900 w-full shadow-lg">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                HackRx 6.0 - Document Query System
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Endpoint: <code className="bg-gray-800 px-2 py-1 rounded">/api/v1/hackrx/run</code>
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-gray-400 text-sm">AI-powered Document Analysis</p>
              <button
                onClick={loadSampleData}
                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
              >
                Load HackRx Sample
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Column - Input Section */}
          <div className="space-y-8">
            {/* Document URL Input */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaUpload className="text-blue-400" />
                  Document URL
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Enter the URL of the PDF, DOCX, or EML document to analyze.
                </p>
              </div>
              <div className="p-6">
                <input
                  type="text"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="e.g., https://example.com/policy.pdf"
                  className="w-full px-5 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Questions Input */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaSearch className="text-green-400" />
                  Enter Questions
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Enter one or more questions, each on a new line.
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="e.g., 
What is the waiting period for pre-existing diseases?
Does this policy cover maternity expenses?
What is the coverage amount for knee surgery?"
                  rows={6}
                  className="w-full px-5 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="w-full">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !documentUrl || !questions}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 transition-all font-bold text-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                    Processing...
                  </span>
                ) : (
                  'Run Analysis'
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Results Section */}
          <div className="space-y-8">
            {submissionStatus === 'idle' && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaInfoCircle className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                  <p className="text-gray-400">
                    Provide a document URL and a list of questions to get started.
                  </p>
                  <button
                    onClick={loadSampleData}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors sm:hidden"
                  >
                    Load HackRx Sample
                  </button>
                </div>
              </div>
            )}
            
            {submissionStatus === 'submitting' && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <div className="animate-spin w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-white mb-2">Analyzing Documents...</h3>
                  <p className="text-gray-400">This may take 15-30 seconds for AI processing.</p>
                </div>
              </div>
            )}

            {submissionStatus === 'error' && result && (
              <div className="bg-gray-800 border border-red-600 rounded-2xl shadow-xl p-8">
                <div className="flex items-center mb-4">
                  <BiErrorCircle className="text-red-500 text-3xl mr-3" />
                  <h3 className="text-xl font-semibold text-red-400">Submission Failed</h3>
                </div>
                <div className="text-gray-300">
                  <p>{result?.answers?.[0] || 'An unknown error occurred.'}</p>
                </div>
              </div>
            )}

            {submissionStatus === 'success' && result && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <MdOutlineDocumentScanner className="text-blue-400" />
                    Analysis Results ({result.answers.length} answers)
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {result.answers.map((answer, index) => (
                    <div key={index} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-gray-300 bg-gray-700">
                          {index + 1}
                        </span>
                        <div className="flex-grow">
                          <h4 className="font-semibold text-lg text-white">
                            Question:
                          </h4>
                          <p className="text-gray-300 text-sm">{questions.split('\n')[index]}</p>
                        </div>
                      </div>
                      
                      {/* HackRx String Response Display */}
                      <div className="bg-gradient-to-r from-blue-950 to-green-950 border-2 border-blue-600 rounded-xl p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <h3 className="text-lg font-medium text-white">
                            Response:
                          </h3>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl">
                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Raw JSON Details */}
                <details className="bg-gray-900 border-t border-gray-700 mt-6">
                  <summary className="cursor-pointer p-4 font-medium text-gray-300 flex items-center hover:bg-gray-800 transition-colors">
                    <LuFileJson className="mr-2" />
                    View Raw JSON Response
                  </summary>
                  <div className="p-4 pt-0">
                    <pre className="bg-black text-green-400 p-4 rounded-xl text-xs overflow-auto font-mono border border-gray-700">
                      {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}