/**
 * This is a file containing constants for all the top level keys in our store
 */
export default {
    // Holds all the user preferences
    PREFERENCES: 'preferences',

    PRS: {
        ASSIGNED: 'prsAssigned',
        REVIEWING: 'prsReviewing',
    },

    ISSUES: {
        ASSIGNED: 'issueAssigned',
        DAILY_IMPROVEMENTS: 'issueDailyImprovements',
        ENGINEERING: 'issueEngineering',
        FILTER: 'issueFilter',
        CHECKBOXES: 'issueCheckboxes',
        HOTPICKS: 'issueHotPicks',
        COLLECTION_PRIORITIES: 'issuePriorities_',
    },

    MILESTONES: 'milestones',

    MANUAL_REQUEST_USERS: 'manualRequestUsers',
    CONTRACTOR_USERS: 'contractorUsers',
    EMPLOYEE_USERS: 'employeeUsers',
    PAYMENT_INFO_LAST_FETCHED: 'paymentInfoLastFetched',
};
