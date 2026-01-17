/**
 * Notification Service
 * Placeholder implementation using console.log
 * In production, replace with actual email/SMS/push notification service
 */

/**
 * Send notification when referral link is clicked
 * @param {string} referrerId - ID of the user who created the referral
 * @param {string} referralCode - The referral code that was clicked
 */
export function notifyReferralLinkClick(referrerId, referralCode) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 REFERRAL NOTIFICATION (Placeholder)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: User ${referrerId}`);
  console.log(`Subject: Your referral link was clicked!`);
  console.log(`Message: Someone clicked your referral link: ${referralCode}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // TODO: Replace with actual email/SMS/push notification
  // Example:
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Your referral link was clicked!',
  //   body: `Someone clicked your referral link: ${referralCode}`
  // });
}

/**
 * Send notification when referral is verified (user signs up)
 * @param {string} referrerId - ID of the user who created the referral
 * @param {string} referredUserId - ID of the user who signed up
 * @param {string} referralCode - The referral code that was used
 */
export function sendReferralNotification(referrerId, referredUserId, referralCode) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 REFERRAL VERIFICATION NOTIFICATION (Placeholder)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: User ${referrerId}`);
  console.log(`Subject: Congratulations! Your referral signed up!`);
  console.log(`Message: User ${referredUserId} signed up using your referral link: ${referralCode}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // TODO: Replace with actual email/SMS/push notification
  // Example:
  // await sendEmail({
  //   to: referrer.email,
  //   subject: 'Congratulations! Your referral signed up!',
  //   body: `User ${referredUser.name} signed up using your referral link.`
  // });
}

/**
 * Send notification when referral is marked as invalid
 * @param {string} referrerId - ID of the user who created the referral
 * @param {string} referralCode - The referral code that was invalid
 * @param {string} reason - Reason why it's invalid
 */
export function notifyInvalidReferral(referrerId, referralCode, reason) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  INVALID REFERRAL NOTIFICATION (Placeholder)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: User ${referrerId}`);
  console.log(`Subject: Referral link issue detected`);
  console.log(`Message: Your referral link ${referralCode} was marked as invalid. Reason: ${reason}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

