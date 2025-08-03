// 'use client';

// import { useState } from 'react';

// interface QueryResult {
//   Decision: "Approved" | "Rejected";
//   Amount: number | null;
//   Justification: string[];
//   context?: any[];
// }

// export default function Home() {
//   const [query, setQuery] = useState('');
//   const [result, setResult] = useState<QueryResult | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<string>('');

//   const handleFileUpload = async () => {
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     setUploadStatus('Uploading...');
    
//     try {
//       const response = await fetch('/api/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
      
//       if (response.ok) {
//         setUploadStatus('✅ File uploaded successfully');
//       } else {
//         setUploadStatus('❌ Upload failed: ' + data.error);
//       }
//     } catch (error) {
//       setUploadStatus('❌ Upload error');
//       console.error('Upload error:', error);
//     }
//   };

//   const handleQuery = async () => {
//     if (!query.trim()) return;

//     setIsLoading(true);
//     setResult(null);

//     try {
//       const response = await fetch('/api/query', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ query }),
//       });

//       const data = await response.json();
//       setResult(data);
//     } catch (error) {
//       console.error('Query error:', error);
//       setResult({
//         Decision: "Rejected",
//         Amount: null,
//         Justification: ["Error occurred while processing query"]
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-4xl">
//       <h1 className="text-3xl font-bold mb-8 text-center">
//         Insurance Policy RAG Bot
//       </h1>

//       {/* File Upload Section */}
//       <div className="mb-8 p-6 border rounded-lg bg-gray-50">
//         <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
//         <div className="flex items-center space-x-4">
//           <input
//             type="file"
//             accept=".pdf,.docx"
//             onChange={(e) => setFile(e.target.files?.[0] || null)}
//             className="flex-1"
//           />
//           <button
//             onClick={handleFileUpload}
//             disabled={!file}
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
//           >
//             Upload
//           </button>
//         </div>
//         {uploadStatus && (
//           <p className="mt-2 text-sm">{uploadStatus}</p>
//         )}
//       </div>

//       {/* Query Section */}
//       <div className="mb-8">
//         <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
//         <div className="flex space-x-4">
//           <input
//             type="text"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="e.g., 46M, knee surgery, Pune, 3-month policy"
//             className="flex-1 px-4 py-2 border rounded-lg"
//             onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
//           />
//           <button
//             onClick={handleQuery}
//             disabled={isLoading || !query.trim()}
//             className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
//           >
//             {isLoading ? 'Processing...' : 'Ask'}
//           </button>
//         </div>
//       </div>

//       {/* Sample Queries */}
//       <div className="mb-8">
//         <h3 className="text-lg font-semibold mb-2">Sample Queries:</h3>
//         <div className="space-y-2">
//           {[
//             "46M, knee surgery, Pune, 3-month policy",
//             "Female, 35 years old, dental treatment, Mumbai",
//             "Heart surgery for 50-year-old male in Delhi"
//           ].map((sample, index) => (
//             <button
//               key={index}
//               onClick={() => setQuery(sample)}
//               className="block w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
//             >
//               {sample}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Results Section */}
//       {result && (
//         <div className="border rounded-lg p-6">
//           <h2 className="text-xl font-semibold mb-4">Results</h2>
          
//           <div className={`p-4 rounded-lg mb-4 ${
//             result.Decision === 'Approved' ? 'bg-green-100' : 'bg-red-100'
//           }`}>
//             <h3 className="font-semibold">
//               Decision: <span className={result.Decision === 'Approved' ? 'text-green-700' : 'text-red-700'}>
//                 {result.Decision}
//               </span>
//             </h3>
            
//             {result.Amount && (
//               <p className="mt-2">
//                 <strong>Amount:</strong> ₹{result.Amount.toLocaleString()}
//               </p>
//             )}
//           </div>

//           <div className="mb-4">
//             <h4 className="font-semibold mb-2">Justification:</h4>
//             <ul className="list-disc list-inside space-y-1">
//               {result.Justification.map((reason, index) => (
//                 <li key={index} className="text-sm">{reason}</li>
//               ))}
//             </ul>
//           </div>

//           <details className="mt-4">
//             <summary className="cursor-pointer font-semibold">Raw Response (Debug)</summary>
//             <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
//               {JSON.stringify(result, null, 2)}
//             </pre>
//           </details>
//         </div>
//       )}
//     </div>
//   );
// }

// 'use client';

// import { useState } from 'react';

// interface QueryResult {
//   Decision: "Approved" | "Rejected";
//   Amount: number | null;
//   Justification: string[];
//   context?: any[];
// }

// export default function Home() {
//   const [query, setQuery] = useState('');
//   const [result, setResult] = useState<QueryResult | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<string>('');

//   const handleFileUpload = async () => {
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     setUploadStatus('Uploading...');
    
//     try {
//       const response = await fetch('/api/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
      
//       if (response.ok) {
//         setUploadStatus('✅ File uploaded successfully');
//       } else {
//         setUploadStatus('❌ Upload failed: ' + data.error);
//       }
//     } catch (error) {
//       setUploadStatus('❌ Upload error');
//       console.error('Upload error:', error);
//     }
//   };

//   const handleQuery = async () => {
//     if (!query.trim()) return;

//     setIsLoading(true);
//     setResult(null);

//     try {
//       const response = await fetch('/api/query', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ query }),
//       });

//       const data = await response.json();
//       setResult(data);
//     } catch (error) {
//       console.error('Query error:', error);
//       setResult({
//         Decision: "Rejected",
//         Amount: null,
//         Justification: ["Error occurred while processing query"]
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="container mx-auto px-4 py-6 max-w-6xl">
//           <div className="text-center">
//             <h1 className="text-4xl font-bold text-gray-900 mb-2">
//               🤖 Insurance Policy RAG Bot
//             </h1>
//             <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//               AI-powered document analysis for insurance claims and policy evaluation
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8 max-w-6xl">
//         <div className="grid lg:grid-cols-2 gap-8">
//           {/* Left Column - Input Section */}
//           <div className="space-y-6">
//             {/* File Upload Section */}
//             <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//               <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
//                 <h2 className="text-xl font-semibold text-white flex items-center">
//                   📄 Upload Documents
//                 </h2>
//                 <p className="text-blue-100 text-sm mt-1">
//                   Upload PDF or DOCX files for analysis
//                 </p>
//               </div>
              
//               <div className="p-6">
//                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
//                   <div className="space-y-4">
//                     <div className="text-4xl">📁</div>
//                     <div>
//                       <input
//                         type="file"
//                         accept=".pdf,.docx"
//                         onChange={(e) => setFile(e.target.files?.[0] || null)}
//                         className="hidden"
//                         id="file-upload"
//                       />
//                       <label
//                         htmlFor="file-upload"
//                         className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//                       >
//                         Choose File
//                       </label>
//                     </div>
//                     {file && (
//                       <p className="text-sm text-gray-600">
//                         Selected: <span className="font-medium">{file.name}</span>
//                       </p>
//                     )}
//                   </div>
//                 </div>
                
//                 <button
//                   onClick={handleFileUpload}
//                   disabled={!file}
//                   className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
//                 >
//                   {uploadStatus.includes('Uploading') ? (
//                     <span className="flex items-center justify-center">
//                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Uploading...
//                     </span>
//                   ) : (
//                     'Upload Document'
//                   )}
//                 </button>
                
//                 {uploadStatus && (
//                   <div className={`mt-4 p-3 rounded-lg text-sm ${
//                     uploadStatus.includes('✅') 
//                       ? 'bg-green-50 text-green-700 border border-green-200' 
//                       : 'bg-red-50 text-red-700 border border-red-200'
//                   }`}>
//                     {uploadStatus}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Query Section */}
//             <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//               <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
//                 <h2 className="text-xl font-semibold text-white flex items-center">
//                   💬 Ask a Question
//                 </h2>
//                 <p className="text-green-100 text-sm mt-1">
//                   Enter your insurance-related query
//                 </p>
//               </div>
              
//               <div className="p-6 space-y-4">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={query}
//                     onChange={(e) => setQuery(e.target.value)}
//                     placeholder="e.g., 46M, knee surgery, Pune, 3-month policy"
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
//                     onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
//                   />
//                 </div>
                
//                 <button
//                   onClick={handleQuery}
//                   disabled={isLoading || !query.trim()}
//                   className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center">
//                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Processing...
//                     </span>
//                   ) : (
//                     '🔍 Analyze Query'
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Sample Queries */}
//             <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//               <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
//                 <h3 className="text-lg font-semibold text-white">💡 Sample Queries</h3>
//                 <p className="text-purple-100 text-sm mt-1">
//                   Try these example queries
//                 </p>
//               </div>
              
//               <div className="p-6 space-y-3">
//                 {[
//                   "46M, knee surgery, Pune, 3-month policy",
//                   "Female, 35 years old, dental treatment, Mumbai",
//                   "Heart surgery for 50-year-old male in Delhi"
//                 ].map((sample, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setQuery(sample)}
//                     className="w-full text-left px-4 py-3 text-sm bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-gray-200 rounded-lg transition-all duration-200"
//                   >
//                     {sample}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Results Section */}
//           <div className="space-y-6">
//             {result ? (
//               <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//                 <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
//                   <h2 className="text-xl font-semibold text-white">📊 Analysis Results</h2>
//                 </div>
                
//                 <div className="p-6 space-y-6">
//                   {/* Decision Card */}
//                   <div className={`p-6 rounded-xl border-2 ${
//                     result.Decision === 'Approved' 
//                       ? 'bg-green-50 border-green-200' 
//                       : 'bg-red-50 border-red-200'
//                   }`}>
//                     <div className="flex items-center space-x-3">
//                       <div className={`text-3xl ${
//                         result.Decision === 'Approved' ? 'text-green-600' : 'text-red-600'
//                       }`}>
//                         {result.Decision === 'Approved' ? '✅' : '❌'}
//                       </div>
//                       <div>
//                         <h3 className="text-xl font-bold text-gray-900">
//                           Decision: <span className={result.Decision === 'Approved' ? 'text-green-700' : 'text-red-700'}>
//                             {result.Decision}
//                           </span>
//                         </h3>
//                         {result.Amount && (
//                           <p className="text-lg font-semibold text-gray-700 mt-1">
//                             💰 Coverage Amount: <span className="text-green-600">₹{result.Amount.toLocaleString()}</span>
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Justification */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                       📋 Justification
//                     </h4>
//                     <ul className="space-y-3">
//                       {result.Justification.map((reason, index) => (
//                         <li key={index} className="flex items-start space-x-3">
//                           <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
//                             {index + 1}
//                           </span>
//                           <span className="text-gray-700">{reason}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>

//                   {/* Debug Info */}
//                   <details className="bg-gray-50 rounded-xl">
//                     <summary className="cursor-pointer p-4 font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
//                       🔍 Technical Details (Debug)
//                     </summary>
//                     <div className="p-4 pt-0">
//                       <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto font-mono">
//                         {JSON.stringify(result, null, 2)}
//                       </pre>
//                     </div>
//                   </details>
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//                 <div className="p-8 text-center">
//                   <div className="text-6xl mb-4">🤔</div>
//                   <h3 className="text-xl font-semibold text-gray-700 mb-2">
//                     Ready to Analyze
//                   </h3>
//                   <p className="text-gray-500">
//                     Upload a document and ask a question to get started with AI-powered analysis
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




















// 'use client';

// import { useState } from 'react';

// interface QueryResult {
//   Decision: "Approved" | "Rejected";
//   Amount: number | null;
//   Justification: string[];
//   context?: Array<{ content: string; metadata: Record<string, unknown> }>
// }

// export default function Home() {
//   const [query, setQuery] = useState('');
//   const [result, setResult] = useState<QueryResult | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<string>('');

//   const handleFileUpload = async () => {
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     setUploadStatus('Uploading...');
    
//     try {
//       const response = await fetch('/api/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
      
//       if (response.ok) {
//         setUploadStatus('File uploaded successfully');
//       } else {
//         setUploadStatus('Upload failed: ' + data.error);
//       }
//     } catch (error) {
//       setUploadStatus('Upload error');
//       console.error('Upload error:', error);
//     }
//   };

//   const handleQuery = async () => {
//     if (!query.trim()) return;

//     setIsLoading(true);
//     setResult(null);

//     try {
//       const response = await fetch('/api/query', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ query }),
//       });

//       const data = await response.json();
//       setResult(data);
//     } catch (error) {
//       console.error('Query error:', error);
//       setResult({
//         Decision: "Rejected",
//         Amount: null,
//         Justification: ["Error occurred while processing query"]
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-black text-white">
//       {/* Header */}
//       <div className="border-b border-gray-800">
//         <div className="container mx-auto px-4 py-8 max-w-6xl">
//           <div className="text-center">
//             <h1 className="text-3xl font-light text-white mb-2">
//               Insurance Policy RAG Bot
//             </h1>
//             <p className="text-gray-400 max-w-2xl mx-auto">
//               AI-powered document analysis for insurance claims and policy evaluation
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8 max-w-6xl">
//         <div className="grid lg:grid-cols-2 gap-8">
//           {/* Left Column - Input Section */}
//           <div className="space-y-6">
//             {/* File Upload Section */}
//             <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
//               <div className="px-6 py-4 border-b border-gray-800">
//                 <h2 className="text-lg font-medium text-white">
//                   Upload Documents
//                 </h2>
//                 <p className="text-gray-400 text-sm mt-1">
//                   Upload PDF or DOCX files for analysis
//                 </p>
//               </div>
              
//               <div className="p-6">
//                 <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
//                   <div className="space-y-4">
//                     <div>
//                       <input
//                         type="file"
//                         accept=".pdf,.docx"
//                         onChange={(e) => setFile(e.target.files?.[0] || null)}
//                         className="hidden"
//                         id="file-upload"
//                       />
//                       <label
//                         htmlFor="file-upload"
//                         className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-600 rounded text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
//                       >
//                         Choose File
//                       </label>
//                     </div>
//                     {file && (
//                       <p className="text-sm text-gray-400">
//                         Selected: <span className="text-white">{file.name}</span>
//                       </p>
//                     )}
//                   </div>
//                 </div>
                
//                 <button
//                   onClick={handleFileUpload}
//                   disabled={!file}
//                   className="w-full mt-4 px-6 py-3 bg-white text-black rounded hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
//                 >
//                   {uploadStatus.includes('Uploading') ? (
//                     <span className="flex items-center justify-center">
//                       <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
//                       Uploading...
//                     </span>
//                   ) : (
//                     'Upload Document'
//                   )}
//                 </button>
                
//                 {uploadStatus && (
//                   <div className={`mt-4 p-3 rounded text-sm border ${
//                     uploadStatus.includes('successfully') 
//                       ? 'bg-gray-800 text-green-400 border-green-800' 
//                       : 'bg-gray-800 text-red-400 border-red-800'
//                   }`}>
//                     {uploadStatus}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Query Section */}
//             <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
//               <div className="px-6 py-4 border-b border-gray-800">
//                 <h2 className="text-lg font-medium text-white">
//                   Ask a Question
//                 </h2>
//                 <p className="text-gray-400 text-sm mt-1">
//                   Enter your insurance-related query
//                 </p>
//               </div>
              
//               <div className="p-6 space-y-4">
//                 <div className="relative">
//                   <input
//                     type="text"
//                     value={query}
//                     onChange={(e) => setQuery(e.target.value)}
//                     placeholder="e.g., 46M, knee surgery, Pune, 3-month policy"
//                     className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
//                     onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
//                   />
//                 </div>
                
//                 <button
//                   onClick={handleQuery}
//                   disabled={isLoading || !query.trim()}
//                   className="w-full px-6 py-3 bg-white text-black rounded hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium"
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center">
//                       <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
//                       Processing...
//                     </span>
//                   ) : (
//                     'Analyze Query'
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Sample Queries */}
//             <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
//               <div className="px-6 py-4 border-b border-gray-800">
//                 <h3 className="text-lg font-medium text-white">Sample Queries</h3>
//                 <p className="text-gray-400 text-sm mt-1">
//                   Try these example queries
//                 </p>
//               </div>
              
//               <div className="p-6 space-y-3">
//                 {[
//                   "46M, knee surgery, Pune, 3-month policy",
//                   "Female, 35 years old, dental treatment, Mumbai",
//                   "Heart surgery for 50-year-old male in Delhi"
//                 ].map((sample, index) => (
//                   <button
//                     key={index}
//                     onClick={() => setQuery(sample)}
//                     className="w-full text-left px-4 py-3 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors"
//                   >
//                     {sample}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Results Section */}
//           <div className="space-y-6">
//             {result ? (
//               <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
//                 <div className="px-6 py-4 border-b border-gray-800">
//                   <h2 className="text-lg font-medium text-white">Analysis Results</h2>
//                 </div>
                
//                 <div className="p-6 space-y-6">
//                   {/* Decision Card */}
//                   <div className={`p-6 rounded border-2 ${
//                     result.Decision === 'Approved' 
//                       ? 'bg-gray-800 border-green-600' 
//                       : 'bg-gray-800 border-red-600'
//                   }`}>
//                     <div className="flex items-center space-x-3">
//                       <div className={`w-3 h-3 rounded-full ${
//                         result.Decision === 'Approved' ? 'bg-green-500' : 'bg-red-500'
//                       }`}></div>
//                       <div>
//                         <h3 className="text-xl font-medium text-white">
//                           Decision: <span className={result.Decision === 'Approved' ? 'text-green-400' : 'text-red-400'}>
//                             {result.Decision}
//                           </span>
//                         </h3>
//                         {result.Amount && (
//                           <p className="text-lg text-gray-300 mt-1">
//                             Coverage Amount: <span className="text-green-400">₹{result.Amount.toLocaleString()}</span>
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Justification */}
//                   <div className="bg-gray-800 border border-gray-700 rounded p-6">
//                     <h4 className="text-lg font-medium text-white mb-4">
//                       Justification
//                     </h4>
//                     <ul className="space-y-3">
//                       {result.Justification.map((reason, index) => (
//                         <li key={index} className="flex items-start space-x-3">
//                           <span className="flex-shrink-0 w-6 h-6 bg-gray-700 text-gray-300 rounded-full flex items-center justify-center text-sm">
//                             {index + 1}
//                           </span>
//                           <span className="text-gray-300">{reason}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>

//                   {/* Debug Info */}
//                   <details className="bg-gray-800 border border-gray-700 rounded">
//                     <summary className="cursor-pointer p-4 font-medium text-gray-300 hover:bg-gray-700 transition-colors">
//                       Technical Details
//                     </summary>
//                     <div className="p-4 pt-0">
//                       <pre className="bg-black text-green-400 p-4 rounded text-xs overflow-auto font-mono border border-gray-800">
//                         {JSON.stringify(result, null, 2)}
//                       </pre>
//                     </div>
//                   </details>
//                 </div>
//               </div>
//             ) : (
//               <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
//                 <div className="p-8 text-center">
//                   <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
//                     <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full"></div>
//                   </div>
//                   <h3 className="text-xl font-medium text-white mb-2">
//                     Ready to Analyze
//                   </h3>
//                   <p className="text-gray-400">
//                     Upload a document and ask a question to get started with AI-powered analysis
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
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

// Ensure Tailwind is configured in the Next.js project for these classes to work.

interface Answer {
  Decision: 'Approved' | 'Rejected';
  Amount: number | null;
  Justification: string[];
}

interface HackRxResponse {
  answers: Answer[];
  error?: string;
}

export default function App() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [questions, setQuestions] = useState('');
  const [result, setResult] = useState<HackRxResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error' | 'submitting'>('idle');
  const [rawResponse, setRawResponse] = useState<unknown>(null);

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
      const response = await fetch('/api/hackerx/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The auth token would be passed here if required by the API
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
          answers: [{
            Decision: 'Rejected',
            Amount: null,
            Justification: [data.error || 'An unexpected error occurred during submission.'],
          }],
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
      setResult({
        answers: [{
          Decision: 'Rejected',
          Amount: null,
          Justification: ['A network or system error occurred. Please check the console.'],
        }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center">
      <Head>
        <title>HackRx RAG System</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="bg-gray-900 w-full shadow-lg">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
              HackRx RAG System
            </h1>
            <p className="text-gray-400 text-sm hidden sm:block">AI-powered Policy Analysis</p>
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
                </div>
              </div>
            )}
            
            {submissionStatus === 'submitting' && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex items-center justify-center h-full p-8">
                <div className="text-center">
                  <div className="animate-spin w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-white mb-2">Analyzing Documents...</h3>
                  <p className="text-gray-400">This may take up to 30 seconds.</p>
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
                  <p>{result?.answers?.[0]?.Justification?.[0] || 'An unknown error occurred.'}</p>
                </div>
              </div>
            )}

            {submissionStatus === 'success' && result && (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <MdOutlineDocumentScanner className="text-blue-400" />
                    Analysis Results
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
                      <div className={`p-4 rounded-xl border-2 ${
                        answer.Decision === 'Approved' 
                          ? 'bg-green-950 border-green-600' 
                          : 'bg-red-950 border-red-600'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            answer.Decision === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <h3 className="text-lg font-medium text-white">
                              Decision: <span className={answer.Decision === 'Approved' ? 'text-green-400' : 'text-red-400'}>
                                {answer.Decision}
                              </span>
                            </h3>
                            {answer.Amount !== null && (
                              <p className="text-gray-300 text-sm mt-1">
                                Coverage Amount: <span className="text-green-400">₹{answer.Amount.toLocaleString()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 bg-gray-800 p-4 rounded-xl">
                        <h4 className="font-medium text-white mb-2">Justification:</h4>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          {answer.Justification.map((reason, jIndex) => (
                            <li key={jIndex} className="flex items-start">
                              <span className="w-1 h-1 bg-blue-400 rounded-full mt-2.5 mr-2 flex-shrink-0"></span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
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

