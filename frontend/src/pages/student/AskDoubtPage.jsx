import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { Navbar } from '../../components/common/Navbar.jsx';
import {
  HelpCircle,
  UploadCloud,
  Code2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  FileText,
  X,
  Sparkles,
  Send
} from 'lucide-react';

export function AskDoubtPage() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [subtopics, setSubtopics] = useState([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState('');

  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [priority, setPriority] = useState('normal');
  const [privacyMode, setPrivacyMode] = useState('normal'); // 'normal' | 'anonymous'

  // Code snippet
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');

  // Attachments
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch student's authorized subjects
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await api.get('/student/subjects');
        if (res.data.success) {
          setSubjects(res.data.subjects);
          if (res.data.subjects.length > 0) {
            handleSubjectChange(res.data.subjects[0].subjectId, res.data.subjects);
          }
        }
      } catch (err) {
        setError('Failed to fetch enrolled subjects');
      }
    }
    fetchSubjects();
  }, []);

  const handleSubjectChange = (subjId, currentSubjects = subjects) => {
    setSelectedSubject(subjId);
    const found = currentSubjects.find(s => s.subjectId === subjId);
    if (found && found.syllabus) {
      setTopics(found.syllabus);
      if (found.syllabus.length > 0) {
        setSelectedTopic(found.syllabus[0].topic);
        setSubtopics(found.syllabus[0].subtopics || []);
        setSelectedSubtopic(found.syllabus[0].subtopics?.[0] || '');
      } else {
        setTopics([]);
        setSelectedTopic('');
        setSubtopics([]);
        setSelectedSubtopic('');
      }
    }
  };

  const handleTopicChange = topicName => {
    setSelectedTopic(topicName);
    const found = topics.find(t => t.topic === topicName);
    if (found) {
      setSubtopics(found.subtopics || []);
      setSelectedSubtopic(found.subtopics?.[0] || '');
    }
  };

  const handleFileChange = e => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 4) {
      setError('You can upload up to 4 attachments');
      return;
    }
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = idx => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }
    if (!selectedTopic) {
      setError('Please select a topic');
      return;
    }
    if (!title.trim() || !questionText.trim()) {
      setError('Title and question details are required');
      return;
    }

    setLoading(true);

    try {
      const activeOffering = subjects.find(s => s.subjectId === selectedSubject);
      if (!activeOffering) throw new Error('Subject offering not found');

      const formData = new FormData();
      formData.append('classSubjectId', activeOffering.classSubjectId);
      formData.append('subjectId', activeOffering.subjectId);
      formData.append('topic', selectedTopic);
      if (selectedSubtopic) formData.append('subtopic', selectedSubtopic);
      formData.append('title', title);
      formData.append('questionText', questionText);
      formData.append('privacyMode', privacyMode);
      formData.append('priority', priority);

      if (showCodeSnippet && codeContent.trim()) {
        formData.append('codeSnippet[language]', codeLanguage);
        formData.append('codeSnippet[code]', codeContent);
      }

      files.forEach(f => {
        formData.append('attachments', f);
      });

      const res = await api.post('/doubts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => {
          navigate(`/student/doubts/${res.data.doubt._id}`);
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        title="Ask Academic Doubt"
        subtitle="AI classification, vector semantic grouping, and dedicated faculty queue routing"
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm font-medium">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Academic Context Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Course Subject <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={e => handleSubjectChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    >
                      {subjects.map(s => (
                        <option key={s.subjectId} value={s.subjectId}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Syllabus Topic <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedTopic}
                      onChange={e => handleTopicChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    >
                      {topics.map(t => (
                        <option key={t.topic} value={t.topic}>
                          {t.topic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subtopic & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subtopics.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Specific Subtopic (Optional)
                      </label>
                      <select
                        value={selectedSubtopic}
                        onChange={e => setSelectedSubtopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="">General topic overview</option>
                        {subtopics.map(st => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Urgency / Priority
                    </label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value="normal">Normal (Standard class review)</option>
                      <option value="high">High (Upcoming exam or assignment)</option>
                      <option value="urgent">Urgent (Immediate blocker)</option>
                      <option value="low">Low (General conceptual curiosity)</option>
                    </select>
                  </div>
                </div>

                {/* Doubt Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Doubt Summary / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Banker algorithm verification when multiple resource instances exist"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* Question Details Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Detailed Question & Context <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    placeholder="Describe what you understand, what specific step is confusing you, and what you have already attempted..."
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    required
                  />
                </div>

                {/* Optional Code Snippet Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    <Code2 className="w-4 h-4" />
                    {showCodeSnippet ? 'Remove code snippet' : '+ Add Code Snippet'}
                  </button>

                  {showCodeSnippet && (
                    <div className="mt-3 p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">Code Block</span>
                        <select
                          value={codeLanguage}
                          onChange={e => setCodeLanguage(e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg outline-none"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="c">C</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java</option>
                          <option value="sql">SQL</option>
                        </select>
                      </div>
                      <textarea
                        rows={5}
                        value={codeContent}
                        onChange={e => setCodeContent(e.target.value)}
                        placeholder="// Paste relevant code here..."
                        className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-3 rounded-lg border border-slate-800 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Attachments Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Attachments (Images, Diagrams, PDFs)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Click to upload file</p>
                    <p className="text-[11px] text-slate-400">PNG, JPG, PDF up to 15MB each (Max 4)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span className="max-w-[150px] truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-slate-400 hover:text-rose-500 ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous Mode Card with Mandatory Institutional Explanation */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-lg ${privacyMode === 'anonymous' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {privacyMode === 'anonymous' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Submission Privacy Mode
                        </h4>
                        <p className="text-xs text-slate-600">
                          {privacyMode === 'anonymous' ? 'Anonymous Mode Enabled' : 'Normal Identified Mode'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPrivacyMode(prev => (prev === 'normal' ? 'anonymous' : 'normal'))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        privacyMode === 'anonymous' ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          privacyMode === 'anonymous' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Section 7 Mandatory Institutional Explanation */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-[11px] leading-relaxed text-slate-600">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5 mb-0.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" /> Institutional Privacy Guarantee:
                    </p>
                    "When you submit anonymously, your identity is hidden from faculty and other students in normal application views. The system may retain a restricted internal record for security and institutional policy."
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span>Processing with AI Engine...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Doubt to Course Faculty</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar: Quick Guidance & Tips */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-2 text-brand-600 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3>How AIDMS Resolves Doubts</h3>
              </div>
              <ol className="text-xs text-slate-600 space-y-3 list-decimal list-inside leading-relaxed">
                <li><strong className="text-slate-800">Instant AI Classification:</strong> The system analyzes question intent and extracts key technical concepts.</li>
                <li><strong className="text-slate-800">Semantic Cohort Grouping:</strong> Similar queries asked across the semester are grouped together to help professors answer once for all.</li>
                <li><strong className="text-slate-800">Faculty Review & Answer:</strong> Your assigned subject professor reviews the doubt group and publishes an official explanation.</li>
                <li><strong className="text-slate-800">Private Ownership:</strong> Even in groups or anonymous mode, you receive direct private notifications and follow-up capability.</li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-cyan-300">Need Immediate Help?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join our active subject chat room to discuss with batchmates and peer teaching assistants in real-time.
              </p>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all block text-center"
              >
                Open Live Discussion
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
