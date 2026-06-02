/**
 * Utility to generate Google Calendar Event Template URLs for Candidates and Employees
 */

interface Candidate {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    currentCompany?: string;
}

interface Job {
    _id: string;
    title: string;
}

interface Interviewer {
    name: string;
    email?: string;
}

interface Interview {
    _id: string;
    candidateId: Candidate;
    jobId: Job;
    interviewerId?: Interviewer;
    date: string; // ISO String
    mode: string;
    stage: string;
    status: string;
    meetingLink?: string;
    feedback?: string;
}

/**
 * Format ISO Date string into YYYYMMDDTHHmmssZ format for Google Calendar
 */
export const formatGoogleCalendarDate = (dateStr: string, durationMinutes = 60): string => {
    const startDate = new Date(dateStr);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const toGCalString = (d: Date) => {
        return d.toISOString()
            .replace(/-|:|\.\d\d\d/g, ""); // Removes -, :, and milliseconds (.000)
    };

    return `${toGCalString(startDate)}/${toGCalString(endDate)}`;
};

/**
 * Generates a Google Calendar event template URL
 */
export const generateGoogleCalendarUrl = (params: {
    title: string;
    dates: string; // "YYYYMMDDTHHmmssZ/YYYYMMDDTHHmmssZ"
    details: string;
    location?: string;
    guests?: string; // Comma separated emails
}) => {
    const baseUrl = "https://calendar.google.com/calendar/render";
    const query = new URLSearchParams({
        action: "TEMPLATE",
        text: params.title,
        dates: params.dates,
        details: params.details,
    });

    if (params.location) {
        query.append("location", params.location);
    }
    if (params.guests) {
        query.append("add", params.guests);
    }

    return `${baseUrl}?${query.toString()}`;
};

/**
 * Get Google Calendar URL for the Candidate
 */
export const getGoogleCalendarCandidateUrl = (interview: Interview): string => {
    const candidateName = interview.candidateId?.name || "Candidate";
    const jobTitle = interview.jobId?.title || "Role";
    const stage = interview.stage || "Interview";
    const interviewerName = interview.interviewerId?.name || "Hiring Team";
    const meetingLink = interview.meetingLink || "";

    const title = `Interview Scheduled: ${jobTitle} - ${stage}`;
    
    const details = `Dear ${candidateName},\n\n` +
        `Your interview has been scheduled for the role of "${jobTitle}" at our company.\n\n` +
        `Details:\n` +
        `- Stage: ${stage}\n` +
        `- Interviewer: ${interviewerName}\n` +
        (meetingLink ? `- Video Link: ${meetingLink}\n` : "") +
        `- Mode: ${interview.mode || "Online"}\n\n` +
        `We look forward to speaking with you!`;

    const dates = formatGoogleCalendarDate(interview.date);
    const guestEmails = [interview.candidateId?.email, interview.interviewerId?.email].filter(Boolean).join(",");

    return generateGoogleCalendarUrl({
        title,
        dates,
        details,
        location: meetingLink,
        guests: guestEmails
    });
};

/**
 * Get Google Calendar URL for the Company Employee / Interviewer
 */
export const getGoogleCalendarEmployeeUrl = (interview: Interview): string => {
    const candidateName = interview.candidateId?.name || "Candidate";
    const candidateEmail = interview.candidateId?.email || "";
    const jobTitle = interview.jobId?.title || "Role";
    const stage = interview.stage || "Interview";
    const interviewerName = interview.interviewerId?.name || "Interviewer";
    const meetingLink = interview.meetingLink || "";

    const title = `Candidate Interview: ${candidateName} - ${jobTitle} (${stage})`;
    
    const details = `Hello ${interviewerName},\n\n` +
        `You have a scheduled candidate interview.\n\n` +
        `Candidate Details:\n` +
        `- Name: ${candidateName}\n` +
        `- Email: ${candidateEmail}\n` +
        (interview.candidateId?.phone ? `- Phone: ${interview.candidateId.phone}\n` : "") +
        (interview.candidateId?.designation ? `- Target Profile/Current Designation: ${interview.candidateId.designation}\n` : "") +
        `\n` +
        `Interview Details:\n` +
        `- Stage: ${stage}\n` +
        `- Mode: ${interview.mode || "Online"}\n` +
        (meetingLink ? `- Video Link: ${meetingLink}\n` : "") +
        `\n` +
        `Please review candidate credentials on CRM prior to the meeting.`;

    const dates = formatGoogleCalendarDate(interview.date);
    const guestEmails = [interview.candidateId?.email, interview.interviewerId?.email].filter(Boolean).join(",");

    return generateGoogleCalendarUrl({
        title,
        dates,
        details,
        location: meetingLink,
        guests: guestEmails
    });
};
