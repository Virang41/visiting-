require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Visitor = require('./models/Visitor');
const Appointment = require('./models/Appointment');
const Pass = require('./models/Pass');
const CheckLog = require('./models/CheckLog');
const qrService = require('./services/qrService');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_pass_db');
    console.log('✅ Connected to MongoDB');
};

const seedDB = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Visitor.deleteMany({});
        await Appointment.deleteMany({});
        await Pass.deleteMany({});
        await CheckLog.deleteMany({});

        console.log('👥 Creating users...');
        const users = await User.create([
            {
                name: 'Admin User',
                email: 'admin@visitpass.com',
                password: 'Admin@123',
                role: 'admin',
                phone: '9876543210',
                department: 'Administration',
                isActive: true
            },
            {
                name: 'Security Guard',
                email: 'security@visitpass.com',
                password: 'Security@123',
                role: 'security',
                phone: '9876543211',
                department: 'Security',
                isActive: true
            },
            {
                name: 'Rajesh Kumar',
                email: 'rajesh@visitpass.com',
                password: 'Employee@123',
                role: 'employee',
                phone: '9876543212',
                department: 'Engineering',
                isActive: true
            },
            {
                name: 'Priya Sharma',
                email: 'priya@visitpass.com',
                password: 'Employee@123',
                role: 'employee',
                phone: '9876543213',
                department: 'Human Resources',
                isActive: true
            },
            {
                name: 'Amit Singh',
                email: 'amit.visitor@gmail.com',
                password: 'Visitor@123',
                role: 'visitor',
                phone: '9876543214',
                isActive: true
            }
        ]);

        const [admin, security, emp1, emp2, visitorUser] = users;

        console.log('🧑‍💼 Creating visitors...');
        const visitors = await Visitor.create([
            {
                name: 'Amit Singh',
                email: 'amit.visitor@gmail.com',
                phone: '9876543214',
                company: 'TechCorp Ltd.',
                idType: 'aadhar',
                idNumber: 'XXXX-XXXX-1234',
                address: '123, MG Road, Bangalore',
                userId: visitorUser._id,
                visitCount: 2
            },
            {
                name: 'Sneha Patel',
                email: 'sneha.patel@example.com',
                phone: '9876543215',
                company: 'Innovate Solutions',
                idType: 'pan',
                idNumber: 'ABCDE1234F',
                address: '456, Nehru Street, Mumbai',
                visitCount: 1
            },
            {
                name: 'Vikram Reddy',
                email: 'vikram.r@biztech.com',
                phone: '9876543216',
                company: 'BizTech Pvt Ltd',
                idType: 'passport',
                idNumber: 'M1234567',
                address: '789, Jubilee Hills, Hyderabad',
                visitCount: 0
            },
            {
                name: 'Nisha Gopalan',
                email: 'nisha.g@finance.org',
                phone: '9876543217',
                company: 'Finance First',
                idType: 'driving_license',
                idNumber: 'TN-0101-1900-1234',
                address: '321, Anna Salai, Chennai',
                visitCount: 3
            }
        ]);

        console.log('📅 Creating appointments...');
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

        const appointments = await Appointment.create([
            {
                visitor: visitors[0]._id,
                host: emp1._id,
                purpose: 'Project Discussion & Technical Review',
                scheduledDate: today,
                scheduledTime: '10:30',
                duration: 90,
                location: 'Conference Room A',
                department: 'Engineering',
                status: 'approved',
                approvedBy: admin._id,
                approvedAt: new Date(),
                notificationSent: true
            },
            {
                visitor: visitors[1]._id,
                host: emp2._id,
                purpose: 'HR Interview - Senior Developer',
                scheduledDate: today,
                scheduledTime: '14:00',
                duration: 60,
                location: 'HR Room',
                department: 'Human Resources',
                status: 'approved',
                approvedBy: emp2._id,
                approvedAt: new Date(),
                notificationSent: true
            },
            {
                visitor: visitors[2]._id,
                host: emp1._id,
                purpose: 'Product Demo Presentation',
                scheduledDate: tomorrow,
                scheduledTime: '11:00',
                duration: 120,
                location: 'Board Room',
                department: 'Engineering',
                status: 'pending',
                notificationSent: false
            },
            {
                visitor: visitors[3]._id,
                host: emp1._id,
                purpose: 'Quarterly Financial Audit',
                scheduledDate: yesterday,
                scheduledTime: '09:00',
                duration: 180,
                location: 'Finance Floor',
                department: 'Finance',
                status: 'completed',
                approvedBy: admin._id,
                approvedAt: yesterday,
                notificationSent: true
            }
        ]);

        console.log('🎫 Issuing passes...');
        // Issue pass for approved appointments
        const passData = async (appt, visitor, host) => {
            const scheduledDateTime = new Date(appt.scheduledDate);
            const [hours, minutes] = appt.scheduledTime.split(':').map(Number);
            scheduledDateTime.setHours(hours, minutes, 0, 0);
            const validFrom = new Date(scheduledDateTime.getTime() - 30 * 60000);
            const validTo = new Date(scheduledDateTime.getTime() + (appt.duration + 60) * 60000);

            const qrData = JSON.stringify({ passId: 'TEMP', visitorName: visitor.name });
            const qrCode = await qrService.generateQR(qrData);

            return {
                appointment: appt._id,
                visitor: visitor._id,
                host: host._id,
                validFrom,
                validTo,
                issuedBy: admin._id,
                location: appt.location,
                status: 'active',
                qrCode,
                qrData: JSON.stringify({ visitorName: visitor.name, validFrom, validTo }),
                accessAreas: ['Main Lobby', 'Meeting Room', appt.location]
            };
        };

        const pass1Data = await passData(appointments[0], visitors[0], emp1);
        const pass2Data = await passData(appointments[1], visitors[1], emp2);
        const passes = await Pass.create([pass1Data, pass2Data]);

        // Update QR data with real passId
        for (const pass of passes) {
            pass.qrData = JSON.stringify({ passId: pass.passId, visitorName: pass.visitor });
            pass.qrCode = await qrService.generateQR(JSON.stringify({ passId: pass.passId }));
            await pass.save();
        }

        console.log('📋 Creating check-in logs...');
        await CheckLog.create([
            {
                pass: passes[0]._id,
                visitor: visitors[0]._id,
                type: 'check-in',
                scannedBy: security._id,
                location: 'Main Entrance',
                method: 'qr_scan',
                timestamp: new Date(today.getTime() - 2 * 60 * 60000)
            },
            {
                pass: passes[0]._id,
                visitor: visitors[0]._id,
                type: 'check-out',
                scannedBy: security._id,
                location: 'Main Entrance',
                method: 'qr_scan',
                timestamp: new Date(today.getTime() - 30 * 60000)
            },
            {
                pass: passes[1]._id,
                visitor: visitors[1]._id,
                type: 'check-in',
                scannedBy: security._id,
                location: 'Main Entrance',
                method: 'manual',
                timestamp: new Date(today.getTime() - 60 * 60000)
            }
        ]);

        console.log('\n✅ Database seeded successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('  DEMO ACCOUNTS');
        console.log('═══════════════════════════════════════');
        console.log('  Admin:    admin@visitpass.com     | Admin@123');
        console.log('  Security: security@visitpass.com  | Security@123');
        console.log('  Employee: rajesh@visitpass.com    | Employee@123');
        console.log('  Employee: priya@visitpass.com     | Employee@123');
        console.log('  Visitor:  amit.visitor@gmail.com  | Visitor@123');
        console.log('═══════════════════════════════════════\n');

    } catch (err) {
        console.error('❌ Seed error:', err.message);
        console.error(err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB disconnected');
        process.exit(0);
    }
};

seedDB();
