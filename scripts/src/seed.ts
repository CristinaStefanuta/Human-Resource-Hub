import { clerkClient } from "@clerk/express";
import { db, usersTable, announcementsTable, requestsTable } from "@workspace/db";

const DUMMY_PASSWORD = "PeopleHub2026!";

const employees = [
  { email: "alice.employee@peoplehub.example.com", firstName: "Alice", lastName: "Johnson", department: "Engineering" },
  { email: "bob.employee@peoplehub.example.com", firstName: "Bob", lastName: "Smith", department: "Design" },
  { email: "carol.employee@peoplehub.example.com", firstName: "Carol", lastName: "Williams", department: "Marketing" },
  { email: "david.employee@peoplehub.example.com", firstName: "David", lastName: "Brown", department: "Sales" },
  { email: "eve.employee@peoplehub.example.com", firstName: "Eve", lastName: "Davis", department: "HR" },
];

const announcements = [
  { title: "Welcome to PeopleHub", content: "We're excited to launch our new HR platform. Please complete your profile and set up your shift preferences." },
  { title: "Summer Hours", content: "Starting next month, the office will move to summer hours with flexible start times between 8:00 AM and 10:00 AM." },
  { title: "Team Offsite", content: "The annual team offsite is scheduled for August 15th. Please submit any time-off requests by the end of the week." },
  { title: "New Equipment Policy", content: "All equipment requests should now be submitted through PeopleHub. IT will review and approve within 48 hours." },
  { title: "Quarterly Reviews", content: "Quarterly performance reviews begin next Monday. Managers will share their schedules shortly." },
];

const requests = [
  { type: "Time Off", reason: "Family vacation to visit relatives out of state." },
  { type: "Equipment", reason: "Need a second monitor for the home office setup." },
  { type: "Remote Work", reason: "Working remotely on Fridays for better focus." },
  { type: "Other", reason: "Requesting access to the new design system library." },
  { type: "Time Off", reason: "Doctor's appointment and recovery time." },
];

async function createEmployee(employee: typeof employees[number]) {
  try {
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [employee.email],
      password: DUMMY_PASSWORD,
      firstName: employee.firstName,
      lastName: employee.lastName,
    });

    const [inserted] = await db
      .insert(usersTable)
      .values({
        clerkId: clerkUser.id,
        email: employee.email,
        name: `${employee.firstName} ${employee.lastName}`,
        role: "Employee",
        department: employee.department,
        avatarUrl: clerkUser.imageUrl,
        shiftPreferences: null,
      })
      .returning();

    return inserted;
  } catch (err) {
    console.error(`Failed to create employee ${employee.email}:`, err);
    throw err;
  }
}

async function seed() {
  console.log("Creating 5 employee accounts...");
  const createdEmployees = [];
  for (const employee of employees) {
    const user = await createEmployee(employee);
    createdEmployees.push(user);
    console.log(`  Created: ${user.name} (${user.email}) — local ID ${user.id}`);
  }

  const firstEmployee = createdEmployees[0];

  console.log("\nCreating 5 announcements...");
  for (const announcement of announcements) {
    const [inserted] = await db
      .insert(announcementsTable)
      .values({
        title: announcement.title,
        content: announcement.content,
        authorId: firstEmployee.id,
      })
      .returning();
    console.log(`  Created: ${inserted.title}`);
  }

  console.log("\nCreating 5 requests...");
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const employee = createdEmployees[i];
    const [inserted] = await db
      .insert(requestsTable)
      .values({
        userId: employee.id,
        type: request.type as "Time Off" | "Equipment" | "Remote Work" | "Other",
        reason: request.reason,
        status: "Pending",
      })
      .returning();
    console.log(`  Created: ${request.type} request by ${employee.name}`);
  }

  console.log("\n=== Demo employee credentials ===");
  console.log(`Email:    ${firstEmployee.email}`);
  console.log(`Password: ${DUMMY_PASSWORD}`);
  console.log(`Name:     ${firstEmployee.name}`);
  console.log(`Role:     Employee`);
  console.log("\nUse these credentials on the Sign In page to test the employee experience.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
