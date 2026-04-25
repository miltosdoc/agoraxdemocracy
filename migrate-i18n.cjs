/**
 * Script to wire new i18n system into all AgoraX frontend components.
 */
const fs = require('fs');
const path = require('path');

const BASE = '/Users/meditalks/projects/agorax/client/src';

// Map of old t("English string") -> new t('key.subkey')
// Keys are the content between t(" and ")
const STRING_KEY_MAP = {
  'Digital Democracy Platform': 'header.digitalDemocracy',
  'Home': 'nav.home',
  'Create': 'nav.create',
  'Profile': 'nav.profile',
  'New Poll': 'nav.newPoll',
  'My Polls': 'nav.myPolls',
  'Login': 'auth.login',
  'Register': 'auth.register',
  'Logout': 'auth.logout',
  'How it works': 'footer.howItWorks',
  'FAQ': 'footer.faq',
  'Terms of Use': 'footer.terms',
  'Privacy Policy Footer': 'footer.privacy',
  'Contact': 'footer.contact',
  'All rights reserved': 'footer.allRightsReserved',
  'Platform for a more open and participatory government': 'footer.tagline',
  'Useful Links': 'footer.usefulLinks',
  'Username': 'auth.username',
  'Password': 'auth.password',
  'Email': 'auth.email',
  'Full Name': 'auth.fullName',
  'Confirm Password': 'auth.confirmPassword',
  'Forgot Password?': 'auth.forgotPassword',
  "Already have an account?": 'auth.haveAccount',
  "Don't have an account?": 'auth.noAccount',
  'Sign Up': 'auth.signUp',
  'Sign In': 'auth.signIn',
  'Sign in with Google': 'auth.signInWithGoogle',
  'Sign up with Google': 'auth.signUpWithGoogle',
  'Login to Vote': 'auth.loginToVote',
  'Or continue with': 'auth.orContinueWith',
  'I accept the': 'auth.acceptTerms',
  'Terms of Service': 'auth.termsOfService',
  'and': 'auth.and',
  'Privacy Policy': 'auth.privacyPolicy',
  'Password must be at least 8 characters': 'auth.passwordMinLength',
  'Loading': 'general.loading',
  'Verified Citizen': 'ballot.verified',
  'Unverified': 'ballot.unverified',
  'Verify with Gov.gr': 'ballot.verify',
  'Notifications': 'notification.title',
  'No notifications': 'notification.empty',
  'Mark as read': 'notification.markRead',
  'Loading notifications...': 'general.loading',
  'New poll in': 'notification.newPollIn',
  'community': 'notification.community',
  'Standard Poll': 'header.standardPoll',
  'Survey Poll (\u0394\u03b7\u03bc\u03bf\u03c3\u03ba\u03bf\u03c0\u03b9\u03ba\u03ae \u03a8\u03b7\u03c6\u03bf\u03c6\u03bf\u03c1\u03af\u03b1)': 'header.surveyPoll',
  'Analytics Dashboard': 'header.analyticsDashboard',
  'Account Management Admin': 'header.accountManagementAdmin',
  'Groups': 'header.groups',
  'My Profile': 'header.myProfile',
  'Communities': 'nav.communities',
  'Back': 'general.back',
  'Cancel': 'general.cancel',
  'Delete': 'general.delete',
  'Close': 'general.close',
  'Submit': 'general.submit',
  'Search': 'general.search',
  'Save': 'general.save',
  'Edit': 'general.edit',
  'Next': 'general.next',
  'Results': 'general.results',
  'Comments': 'general.comments',
  'Vote': 'general.vote',
  'Details': 'general.details',
  'Error': 'general.error',
  'Success': 'general.success',
  'Loading...': 'general.loading',
  'Active Polls': 'poll.activePolls',
  'Completed': 'poll.completed',
  'All': 'poll.all',
  'Extend': 'general.next',
  'User Information': 'profile.userInformation',
  'Name': 'profile.name',
  'Location': 'notification.location',
  'Coordinates': 'profile.coordinates',
  'Location Settings': 'profile.locationSettings',
  'Account Management': 'admin.manageAccounts',
  'Update your location to participate in location-restricted polls': 'profile.updateLocation',
  'Manage your account settings and preferences': 'admin.manageAccountsDesc',
  'Groups Management': 'groups.management',
  'Manage your groups and members': 'groups.manageGroups',
  'Create New Group': 'groups.createNewGroup',
  'Create your first group to collaborate with others': 'groups.createFirstGroup',
  'Group Name': 'groups.groupName',
  'Enter group name': 'groups.enterGroupName',
  'Create Group': 'groups.createGroup',
  'My Groups': 'groups.myGroups',
  'No groups yet': 'groups.noGroups',
  'Creator': 'groups.creator',
  'Add Member': 'groups.addMember',
  'Member Email': 'groups.memberEmail',
  'Enter member email': 'groups.enterMemberEmail',
  'Add': 'groups.add',
  'Leave Group': 'groups.leaveGroup',
  'Confirm Leave Group': 'groups.confirmLeaveGroup',
  'Are you sure you want to leave': 'groups.areYouSureLeave',
  'Delete Group': 'groups.deleteGroup',
  'Confirm Delete Group': 'groups.confirmDeleteGroup',
  'This action cannot be undone. This will permanently delete the group and all its data.': 'groups.deleteGroupWarning',
  'Group Created': 'groups.groupCreated',
  'Group created successfully': 'groups.groupCreatedSuccess',
  'Member Added': 'groups.memberAdded',
  'Member added successfully': 'groups.memberAddedSuccess',
  'User with this email is not registered': 'groups.userNotRegistered',
  'Failed to add member': 'groups.failedToAddMember',
  'Left Group': 'groups.leftGroup',
  'You have left the group': 'groups.leftGroupSuccess',
  'Failed to leave group': 'groups.failedToLeaveGroup',
  'Group Deleted': 'groups.groupDeleted',
  'Group deleted successfully': 'groups.groupDeletedSuccess',
  'Failed to delete group': 'groups.failedToDeleteGroup',
  'Failed to create group': 'groups.failedToCreateGroup',
  'Invalid email format': 'groups.invalidEmail',
  'Total Users': 'notification.totalUsers',
  'Total Polls': 'notification.totalPolls',
  'Total Votes': 'notification.totalVotes',
  'Total Comments': 'notification.totalComments',
  'Registered community members': 'analytics.registeredMembers',
  'currently active': 'analytics.currentlyActive',
  'Community participation': 'analytics.communityParticipation',
  'Discussion engagement': 'analytics.discussionEngagement',
  'Popular Categories': 'analytics.popularCategories',
  'Activity Trends (Last 30 Days)': 'analytics.activityTrends30',
  'Hourly Activity Pattern': 'analytics.hourlyPattern',
  'Daily Activity Pattern': 'analytics.dailyPattern',
  'Most Popular Polls': 'analytics.mostPopularPolls',
  'Activity': 'notification.activity',
  'votes': 'analytics.votes',
  'comments': 'analytics.comments_',
  'Created on': 'analytics.createdOn',
  'Participation Rate': 'notification.participationRate',
  '% of users who have voted': 'analytics.pctUsersVoted',
  'Avg Votes per Poll': 'notification.avgVotesPerPoll',
  'Average participation per poll': 'analytics.avgParticipationPerPoll',
  'Avg Comments per Poll': 'notification.avgCommentsPerPoll',
  'Average discussion per poll': 'analytics.avgDiscussionPerPoll',
  'New Users (7 Days)': 'notification.newUsers7Days',
  'New signups this week': 'analytics.newSignupsWeek',
  'New Users (30 Days)': 'notification.newUsers30Days',
  'New signups this month': 'analytics.newSignupsMonth',
  'Active Users (7 Days)': 'notification.activeUsers7Days',
  'Users who voted or commented this week': 'analytics.usersVotedCommentedWeek',
  'Active Users (30 Days)': 'notification.activeUsers30Days',
  'Users who voted or commented this month': 'analytics.usersVotedCommentedMonth',
  'Platform insights and usage statistics': 'analytics.adminRequiredDesc',
  'Filter by Status': 'admin.filterByStatus',
  'Flagged': 'admin.flagged',
  'Banned': 'admin.banned',
  'Search by username or email': 'admin.searchUsernameEmail',
  'Account Status': 'admin.accountStatus',
  'Registration IP': 'admin.registrationIp',
  'Last Login IP': 'admin.lastLoginIp',
  'Device Fingerprint': 'admin.deviceFingerprint',
  'View Activity': 'admin.viewActivity',
  'Ban': 'admin.ban',
  'Approve': 'admin.approve',
  'User Activity': 'admin.userActivity',
  'Action': 'admin.action',
  'Actions': 'admin.actions',
  'IP Address': 'admin.ipAddress',
  'Timestamp': 'admin.timestamp',
  'No users found': 'admin.noUsersFound',
  'No activity found': 'admin.noActivityFound',
  'N/A': 'admin.na',
  'User has been banned successfully': 'admin.userBanned',
  'User has been approved successfully': 'admin.userApproved',
  'Failed to ban user': 'admin.failedBan',
  'Failed to approve user': 'admin.failedApprove',
  'Manage user accounts and monitor activity': 'admin.manageAccountsDesc',
  'member': 'groups.member',
  'members': 'groups.members',
  'Submit Score': 'sortition.submitScore',
  'Members': 'sortition.members',
  'Proposals': 'home.proposals',
  'Sortition': 'sortition.scoring',
  'Democracy Score': 'community.democracyScore',
  'Sign up': 'auth.signUp',
  'Delete Account': 'notification.deleteAccount',
  'Delete Your Account': 'notification.deleteYourAccount',
  'This action cannot be undone. This will permanently delete your account and remove your data from our servers.': 'notification.deleteAccountWarning',
  'Also delete all polls I created': 'notification.alsoDeletePolls',
  'If unchecked, your polls will be transferred to the community but remain available.': 'notification.pollsTransferNote',
  'Are you sure you want to delete your account?': 'notification.confirmDeleteAccount',
  'Deleting...': 'notification.deleting',
  'Account Deleted': 'notification.accountDeleted',
  'Failed to delete account. Please try again.': 'notification.failedDeleteAccount',
};

// Files that are not React components (can't use hooks)
const NON_COMPONENT_FILES = new Set([
  'lib/queryClient.ts',
  'hooks/use-auth.tsx',
  'hooks/use-share.ts',
]);

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(BASE, filePath);
  
  // Check if file uses old i18n import
  if (!content.includes('from "@/i18n"') && !content.includes("from '@/i18n'")) return false;
  
  const isNonComponent = [...NON_COMPONENT_FILES].some(f => relPath.endsWith(f));
  
  if (isNonComponent) {
    // For non-component files, import a standalone t function
    content = content.replace(/import\s+(?:t|\{\s*t\s*\})\s+from\s+["']@\/i18n["'];?\n?/g, 
      `import { getTranslationFunction } from "@/hooks/use-translation";\nconst t = getTranslationFunction();\n`);
    
    // Still replace t("string") calls
    content = replaceTCalls(content);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated (non-component): ${relPath}`);
    return true;
  }
  
  // For React components:
  // 1. Replace old import with new import
  content = content.replace(/import\s+t\s+from\s+["']@\/i18n["'];?\n?/g, 
    `import { useTranslation } from "@/hooks/use-translation";\n`);
  content = content.replace(/import\s+\{\s*t\s*\}\s+from\s+["']@\/i18n["'];?\n?/g, 
    `import { useTranslation } from "@/hooks/use-translation";\n`);
  
  // 2. Add hook call if not already present
  if (!content.includes('useTranslation()')) {
    // Find the first function definition and add the hook after the opening brace
    // Try multiple patterns
    const patterns = [
      /export\s+default\s+function\s+(\w+)\s*\([^)]*\)\s*\{/,
      /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{/,
      /function\s+(\w+)\s*\([^)]*\)\s*\{/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const idx = content.indexOf(match[0]) + match[0].length;
        content = content.slice(0, idx) + '\n  const { t, locale } = useTranslation();' + content.slice(idx);
        break;
      }
    }
  }
  
  // 3. Replace t("string") calls
  content = replaceTCalls(content);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Updated: ${relPath}`);
  return true;
}

function replaceTCalls(content) {
  // Replace t("English string") with t('key.subkey')
  // Match t("...") or t('...')
  for (const [oldStr, newKey] of Object.entries(STRING_KEY_MAP)) {
    // Match both t("string") and t('string')
    const escaped = oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Double quotes
    content = content.replace(new RegExp(`t\\("${escaped}"\\)`, 'g'), `t('${newKey}')`);
    // Single quotes  
    content = content.replace(new RegExp(`t\\('${escaped}'\\)`, 'g'), `t('${newKey}')`);
  }
  return content;
}

// Walk through all files
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      try {
        processFile(fullPath);
      } catch (e) {
        console.error(`Error processing ${fullPath}:`, e.message);
      }
    }
  }
}

console.log('Starting i18n migration...');
walk(BASE);
console.log('Done with bulk migration.');
