const prompts = {
    booking: `Create the TypeScript classes for a product ordering system data models, only use properties to define the data models without using any methods or constructors.`
}

export const booking = `// Represents the status of a booking
enum BookingStatus {
    Pending = "Pending",
    Confirmed = "Confirmed", // The booking has been confirmed
    // The booking has been cancelled
    Cancelled = "Cancelled",
}

// Represents a time slot for booking
interface TimeSlot {
    start: Date;
    end: Date;
}

enum ServiceType {
    Basic = 1,
    Premium,
    Deluxe,
}

// Represents a service that can be booked
class Service {
    id: number;
    type: ServiceType;
    name: string;
    description: string; // Description of the service
    price: number;
}

// Represents a customer who makes a booking
class Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

// Represents a booking
interface Booking {
    id: number;
    customer: Customer;
    service: Service;
    // The time slot for the booking
    timeSlot: TimeSlot; // Uses TimeSlot interface
    status: BookingStatus;
    notes?: string; // Optional additional notes
}`

export const jobBoard = `
// Enum for job types
export enum JobType {
  FullTime,
  PartTime,
  Contract,
  Internship,
}

// Enum for job categories
export enum JobCategory {
  SoftwareDevelopment,
  DataScience,
  ProductManagement,
  Design,
  Other,
}

// Enum for job status
export enum JobStatus {
  Open,
  Closed,
  Pending,
}

// Interface for Company
export class Company {
  id: number
  name: string
  description: string
  website: string
}

// Interface for Job
export class Job {
  id: number
  companyId: number
  title: string
  description: string
  type: JobType
  category: JobCategory
  status: JobStatus
  postedAt: Date
}

// Interface for Job Requirement
export class JobRequirement {
  id: number
  jobId: number
  skill: string
  experience: number
  description: string
}

// Interface for Job Applicant
export class JobApplicant {
  id: number
  jobId: number
  name: string
  email: string
  resume: string
  coverLetter: string
  appliedAt: Date
}

// Interface for Interview
export class Interview {
  id: number
  jobApplicantId: number
  scheduledAt: Date
  conductedAt: Date
  result: string
}
`