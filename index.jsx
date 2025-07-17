import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Partners from "./Partners";

import Tasks from "./Tasks";

import Analytics from "./Analytics";

import HRReports from "./HRReports";

import Projects from "./Projects";

import Sales from "./Sales";

import ProjectDetail from "./ProjectDetail";

import Messages from "./Messages";

import ApplyForAccess from "./ApplyForAccess";

import Approvals from "./Approvals";

import Files from "./Files";

import CostBreakdownDetail from "./CostBreakdownDetail";

import StoreVisits from "./StoreVisits";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Partners: Partners,
    
    Tasks: Tasks,
    
    Analytics: Analytics,
    
    HRReports: HRReports,
    
    Projects: Projects,
    
    Sales: Sales,
    
    ProjectDetail: ProjectDetail,
    
    Messages: Messages,
    
    ApplyForAccess: ApplyForAccess,
    
    Approvals: Approvals,
    
    Files: Files,
    
    CostBreakdownDetail: CostBreakdownDetail,
    
    StoreVisits: StoreVisits,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Partners" element={<Partners />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/HRReports" element={<HRReports />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Sales" element={<Sales />} />
                
                <Route path="/ProjectDetail" element={<ProjectDetail />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/ApplyForAccess" element={<ApplyForAccess />} />
                
                <Route path="/Approvals" element={<Approvals />} />
                
                <Route path="/Files" element={<Files />} />
                
                <Route path="/CostBreakdownDetail" element={<CostBreakdownDetail />} />
                
                <Route path="/StoreVisits" element={<StoreVisits />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}