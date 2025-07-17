
import React, { useState, useEffect } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { AttendanceReport } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Upload,
  Calendar,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  ExternalLink,
  Users,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { User } from "@/api/entities";

const ReportDetailsCard = ({ report, onClear }) => {
  if (!report) return null;

  let extractedData = null;
  if (report.ai_insights && typeof report.ai_insights === 'string') {
    try {
      extractedData = JSON.parse(report.ai_insights);
    } catch (e) {
      console.error("Error parsing report data:", e);
    }
  }

  // Timezone fix for report.report_date display
  // If report.report_date is a YYYY-MM-DD string, new Date(string) can interpret it as UTC,
  // leading to off-by-one day errors when formatted to local time.
  // We explicitly construct a local date to prevent this.
  let displayReportDate = '';
  try {
    const dateParts = report.report_date.split('-');
    if (dateParts.length === 3) { // Expecting YYYY-MM-DD format
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in Date constructor
      const day = parseInt(dateParts[2], 10);
      const localDate = new Date(year, month, day); // Creates a date object in local timezone
      displayReportDate = format(localDate, 'MMMM d, yyyy');
    } else {
      // Fallback for full ISO strings or unexpected formats (e.g., YYYY-MM-DDTHH:mm:ss.sssZ)
      // In this case, new Date() parses correctly, and format converts to local.
      displayReportDate = format(new Date(report.report_date), 'MMMM d, yyyy');
    }
  } catch (error) {
    console.error("Error formatting report date:", error);
    displayReportDate = report.report_date; // Show raw date if formatting fails
  }

  const LeaveSection = ({ title, data, colorClass }) => {
    if (!data || data.length === 0) return null;

    const baseColor = colorClass.split('-')[0]; // e.g., 'orange'

    return (
      <div className={`p-4 bg-${baseColor}-50 border border-${baseColor}-200 rounded-lg`}>
        <h4 className={`font-bold text-${baseColor}-800 flex items-center gap-2 mb-3`}>
          <Calendar className="w-4 h-4" />
          {title}
        </h4>
        <div className="space-y-3">
          {data.map((item, idx) => {
            const parts = item.split(':');
            const location = parts[0];
            const details = parts.slice(1).join(':').trim();
            return (
              <div key={idx}>
                <p className={`font-semibold text-${baseColor}-800`}>{location}:</p>
                <p className={`text-sm text-${baseColor}-700 pl-2`}>{details}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5" />
            {report.report_name}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
        <p className="text-slate-600 text-sm">
          Report Date: {displayReportDate}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        <LeaveSection title="Annual Leave (年假)" data={extractedData?.annual_leave} colorClass="orange" />
        <LeaveSection title="Pending Regular Leave (例假)" data={extractedData?.pending_regular_leave} colorClass="blue" />
        <LeaveSection title="Statutory Holiday (SH)" data={extractedData?.statutory_holiday} colorClass="red" />

        {/* Show message if no data found */}
        {!extractedData && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              No Extracted Data Found
            </h4>
            <p className="text-yellow-700 text-sm">
              This report may not have been processed for data extraction, or the extraction failed.
            </p>
          </div>
        )}

        {/* Notes Section */}
        {report.notes && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-slate-800 mb-2">Notes</h4>
            <p className="text-slate-700 text-sm">{report.notes}</p>
          </div>
        )}

        {/* View Original File Button */}
        <Button asChild variant="outline" className="w-full mt-4">
          <a href={report.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Original PDF
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

// This page now receives currentUser and isAdmin from Layout.js
export default function HRReports() {
  const { currentUser, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportNotes, setReportNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // State for error messages
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if(currentUser) { // Only load reports if currentUser is available
        loadReports();
    }
  }, [currentUser]); // Depend on currentUser

  const loadReports = async () => {
    setErrorMessage(""); // Clear previous error messages when loading
    try {
      setIsLoading(true);
      const reportsData = await AttendanceReport.list("-report_date");
      setReports(reportsData);
    } catch (error) {
      console.error("Error loading reports:", error);
      setErrorMessage("Failed to load reports. Please refresh the page."); // Improved messaging
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setErrorMessage(""); // Clear error message when a new file is selected
  };

  const extractReportData = async (fileUrl) => {
    try {
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            annual_leave: {
              type: "array",
              items: { type: "string" },
              description: "List of annual leave information for staff members"
            },
            pending_regular_leave: {
              type: "array",
              items: { type: "string" },
              description: "List of pending regular leave for staff members"
            },
            statutory_holiday: {
              type: "array",
              items: { type: "string" },
              description: "List of statutory holiday information"
            },
            sick_leave: {
              type: "array",
              items: { type: "string" },
              description: "List of sick leave usage"
            },
            overtime: {
              type: "array",
              items: { type: "string" },
              description: "List of overtime information"
            }
          }
        }
      });

      console.log("Extraction result:", extractResult);
      return extractResult.output || null;
    } catch (error) {
      console.error("Error extracting report data:", error);
      setErrorMessage("Data extraction failed. The report will be uploaded without AI insights."); // Improved messaging
      return null;
    }
  };

  const handleUpload = async () => {
    setErrorMessage(""); // Clear previous errors
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload."); // Improved messaging
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file: selectedFile });

      const extractedData = await extractReportData(file_url);

      await AttendanceReport.create({
        report_name: selectedFile.name,
        // Timezone fix: Use ISO string split to ensure a consistent UTC date (YYYY-MM-DD)
        // regardless of client's local timezone for storage.
        report_date: new Date().toISOString().split('T')[0],
        file_url,
        uploaded_by: currentUser.email, // Use currentUser email
        notes: reportNotes,
        ai_insights: extractedData ? JSON.stringify(extractedData) : null
      });

      setSelectedFile(null);
      setReportNotes("");
      if(fileInputRef.current) fileInputRef.current.value = "";
      loadReports(); // Refresh the list
    } catch (error) {
      console.error("Error uploading report:", error);
      setErrorMessage("Upload failed. Please try again."); // Improved messaging
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    setErrorMessage(""); // Clear previous errors
    if (!isAdmin) {
      setErrorMessage("You do not have permission to delete reports."); // Improved messaging
      return;
    }
    if (window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      try {
        await AttendanceReport.delete(reportId);
        loadReports(); // Refresh the list
        if (selectedReport?.id === reportId) {
          setSelectedReport(null); // Clear selected report if it was the one deleted
        }
      } catch (error) {
        console.error("Error deleting report:", error);
        setErrorMessage("Failed to delete report. Please try again."); // Improved messaging
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            HR & Attendance Reports
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Upload attendance reports and view key HR insights
          </p>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{errorMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setErrorMessage("")}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L6.05 6.27a1.2 1.2 0 1 1 1.697-1.697l2.651 3.029 2.651-3.029a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15 2.758 3.15a1.2 1.2 0 0 1 0 1.697z"/></svg>
            </span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: Report Details or Upload Form */}
          <div className="lg:col-span-2 space-y-6">
            {selectedReport ? (
              <ReportDetailsCard report={selectedReport} onClear={() => setSelectedReport(null)} />
            ) : (
              isAdmin ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload New Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.csv,.xlsx"
                      onChange={handleFileChange}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    <Textarea
                      placeholder="Add summary notes or key issues from this report..."
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                    />
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || !selectedFile}
                      className="w-full bg-amber-500 hover:bg-amber-600"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-600 text-lg flex items-center justify-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      You do not have permission to upload new reports.
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Right Column: History */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Report History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {isLoading ? <p>Loading reports...</p> :
                  reports.length > 0 ? (
                    reports.map(report => (
                      <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border gap-2 hover:bg-amber-50 transition-colors cursor-pointer">
                        <button onClick={() => setSelectedReport(report)} className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-slate-800 truncate">{report.report_name}</p>
                          <p className="text-xs text-slate-500">
                            {/* Display date consistently using the same local date logic */}
                            {(() => {
                              try {
                                const dateParts = report.report_date.split('-');
                                if (dateParts.length === 3) {
                                  const year = parseInt(dateParts[0], 10);
                                  const month = parseInt(dateParts[1], 10) - 1;
                                  const day = parseInt(dateParts[2], 10);
                                  const localDate = new Date(year, month, day);
                                  return format(localDate, 'MMM d, yyyy');
                                } else {
                                  return format(new Date(report.report_date), 'MMM d, yyyy');
                                }
                              } catch (e) {
                                console.error("Error formatting date in history:", e);
                                return report.report_date; // Fallback to raw date
                              }
                            })()}
                          </p>
                        </button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-500 py-4">No reports uploaded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
