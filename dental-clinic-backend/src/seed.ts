import { PrismaClient, Role, AppointmentType, AppointmentStatus, PaymentStatus, PaymentMethod, Gender } from '@prisma/client';
import { hashPassword } from './utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dentalclinic.com' },
    update: {
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '555-0100',
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: 'admin@dentalclinic.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '555-0100',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create receptionist
  const receptionistPassword = await hashPassword('reception123');
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@dentalclinic.com' },
    update: {
      password: receptionistPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '555-0101',
      role: Role.RECEPTIONIST,
      isActive: true,
    },
    create: {
      email: 'reception@dentalclinic.com',
      password: receptionistPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '555-0101',
      role: Role.RECEPTIONIST,
      isActive: true,
    },
  });
  console.log('✅ Receptionist user created:', receptionist.email);

  // Create dentist
  const dentistPassword = await hashPassword('dentist123');
  const dentist = await prisma.user.upsert({
    where: { email: 'dentist@dentalclinic.com' },
    update: {
      password: dentistPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '555-0102',
      role: Role.DENTIST,
      isActive: true,
    },
    create: {
      email: 'dentist@dentalclinic.com',
      password: dentistPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      phone: '555-0102',
      role: Role.DENTIST,
      isActive: true,
      staffProfile: {
        create: {
          employeeId: 'EMP-001',
          hireDate: new Date('2020-01-15'),
          specialization: 'General Dentistry',
          licenseNumber: 'DDS-12345',
          department: 'General Dentistry',
          biography: 'Dr. Michael Chen has over 10 years of experience in general dentistry.',
        },
      },
    },
  });
  console.log('✅ Dentist user created:', dentist.email);

    // Create doctor
    const doctorPassword = await hashPassword('doctor123');
    const doctor = await prisma.user.upsert({
      where: { email: 'doctor@dentalclinic.com' },
      update: {
        password: doctorPassword,
        firstName: 'Sarah',
        lastName: 'Ahmed',
        phone: '555-0106',
        role: Role.DOCTOR,
        isActive: true,
      },
      create: {
        email: 'doctor@dentalclinic.com',
        password: doctorPassword,
        firstName: 'Sarah',
        lastName: 'Ahmed',
        phone: '555-0106',
        role: Role.DOCTOR,
        isActive: true,
        staffProfile: {
          create: {
            employeeId: 'EMP-006',
            hireDate: new Date('2021-08-12'),
            specialization: 'General Dentistry',
            licenseNumber: 'DDS-67890',
            department: 'General Dentistry',
            biography: 'Dr. Sarah Ahmed focuses on comprehensive general dentistry.',
          },
        },
      },
    });
    console.log('âœ… Doctor user created:', doctor.email);

    // Create specialist
  const specialistPassword = await hashPassword('specialist123');
  const specialist = await prisma.user.upsert({
    where: { email: 'specialist@dentalclinic.com' },
    update: {
      password: specialistPassword,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      phone: '555-0103',
      role: Role.SPECIALIST,
      isActive: true,
    },
    create: {
      email: 'specialist@dentalclinic.com',
      password: specialistPassword,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      phone: '555-0103',
      role: Role.SPECIALIST,
      isActive: true,
      staffProfile: {
        create: {
          employeeId: 'EMP-002',
          hireDate: new Date('2019-06-01'),
          specialization: 'Orthodontics',
          licenseNumber: 'ORT-54321',
          department: 'Orthodontics',
          biography: 'Dr. Emily Rodriguez is a board-certified orthodontist.',
        },
      },
    },
  });
  console.log('✅ Specialist user created:', specialist.email);

  // Create nurse
  const nursePassword = await hashPassword('nurse123');
  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@dentalclinic.com' },
    update: {
      password: nursePassword,
      firstName: 'Jessica',
      lastName: 'Williams',
      phone: '555-0104',
      role: Role.NURSE,
      isActive: true,
    },
    create: {
      email: 'nurse@dentalclinic.com',
      password: nursePassword,
      firstName: 'Jessica',
      lastName: 'Williams',
      phone: '555-0104',
      role: Role.NURSE,
      isActive: true,
      staffProfile: {
        create: {
          employeeId: 'EMP-003',
          hireDate: new Date('2021-03-15'),
          department: 'General Dentistry',
        },
      },
    },
  });
  console.log('✅ Nurse user created:', nurse.email);

  // Create dental assistant
  const assistantPassword = await hashPassword('assistant123');
  const assistant = await prisma.user.upsert({
    where: { email: 'assistant@dentalclinic.com' },
    update: {
      password: assistantPassword,
      firstName: 'David',
      lastName: 'Brown',
      phone: '555-0105',
      role: Role.DENTIST_ASSISTANT,
      isActive: true,
    },
    create: {
      email: 'assistant@dentalclinic.com',
      password: assistantPassword,
      firstName: 'David',
      lastName: 'Brown',
      phone: '555-0105',
      role: Role.DENTIST_ASSISTANT,
      isActive: true,
      staffProfile: {
        create: {
          employeeId: 'EMP-004',
          hireDate: new Date('2022-01-10'),
          department: 'General Dentistry',
        },
      },
    },
  });
  console.log('✅ Dental assistant user created:', assistant.email);

  // Create sample patient
  const patientPassword = await hashPassword('patient123');
  const patient = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {
      password: patientPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0200',
      role: Role.PATIENT,
      isActive: true,
    },
    create: {
      email: 'patient@example.com',
      password: patientPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0200',
      role: Role.PATIENT,
      isActive: true,
      patientProfile: {
        create: {
          dateOfBirth: new Date('1985-05-15'),
          gender: Gender.MALE,
          address: '123 Main Street',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          emergencyContact: 'Jane Doe',
          emergencyPhone: '555-0201',
          insuranceProvider: 'Blue Cross',
          insurancePolicyNumber: 'BC123456789',
          medicalHistory: 'No significant medical history',
          allergies: 'None known',
        },
      },
    },
  });
  console.log('✅ Patient user created:', patient.email);

  // Demo in-app messages for testing
  await prisma.message.deleteMany({
    where: {
      subject: {
        startsWith: '[Demo]',
      },
    },
  });
  await prisma.message.createMany({
    data: [
      {
        senderId: admin.id,
        recipientId: patient.id,
        subject: '[Demo] Welcome to the clinic portal',
        content:
          'Welcome to the patient portal. You can view appointments, billing, and send secure messages here.',
      },
      {
        senderId: receptionist.id,
        recipientId: patient.id,
        subject: '[Demo] Appointment reminder',
        content:
          'This is a reminder for your upcoming appointment tomorrow at 10:00 AM. Please arrive 10 minutes early.',
      },
      {
        senderId: patient.id,
        recipientId: receptionist.id,
        subject: '[Demo] Need to reschedule',
        content:
          'Hello, I may need to move my appointment to next week. Please share available time slots.',
      },
      {
        senderId: dentist.id,
        recipientId: patient.id,
        subject: '[Demo] Post-treatment instructions',
        content:
          'Please avoid very hot/cold food for 24 hours after the filling. Contact us if pain persists.',
      },
      {
        senderId: specialist.id,
        recipientId: dentist.id,
        subject: '[Demo] Specialist referral notes',
        content:
          'I reviewed the case and recommend orthodontic follow-up in 2 weeks with updated X-rays.',
      },
      {
        senderId: nurse.id,
        recipientId: doctor.id,
        subject: '[Demo] Lab result available',
        content:
          'Lab result for Patient John Doe is available in records. Please review before afternoon rounds.',
      },
    ],
  });
  console.log('✅ Demo messages created');

  // Create additional test patients
  const firstNames = ['Alex', 'Maria', 'James', 'Linda', 'Robert', 'Patricia', 'Michael', 'Barbara', 'David', 'Elizabeth', 'William', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Garcia', 'Martinez', 'Davis', 'Lopez', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark'];
  const cities = ['Los Angeles', 'San Diego', 'San Jose', 'Sacramento', 'Fresno'];
  const states = ['CA', 'TX', 'NY', 'FL', 'WA'];
  const testPatientProfiles: { id: string; userId: string }[] = [];

  for (let i = 1; i <= 20; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[(i - 1) % lastNames.length];
    const email = `test.patient${String(i).padStart(2, '0')}@example.com`;
    const created = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: patientPassword,
        firstName,
        lastName,
        phone: `555-02${String(i).padStart(2, '0')}`,
        role: Role.PATIENT,
        isActive: true,
        patientProfile: {
          create: {
            dateOfBirth: new Date(1990, (i - 1) % 12, ((i * 3) % 28) + 1),
            gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
            address: `${100 + i} Main Street`,
            city: cities[i % cities.length],
            state: states[i % states.length],
            zipCode: `9${String(1000 + i)}`,
            emergencyContact: 'Emergency Contact',
            emergencyPhone: '555-0999',
            insuranceProvider: 'HealthNet',
            insurancePolicyNumber: `HN${100000 + i}`,
          },
        },
      },
      include: {
        patientProfile: true,
      },
    });
    if (created.patientProfile) {
      testPatientProfiles.push({ id: created.patientProfile.id, userId: created.id });
    }
  }
  console.log('✅ Test patients created:', testPatientProfiles.length);

  // Create treatment categories
  const categories = [
    { name: 'Preventive Care', description: 'Regular checkups and cleanings', color: '#10B981', icon: 'shield' },
    { name: 'Restorative', description: 'Fillings, crowns, and bridges', color: '#3B82F6', icon: 'tool' },
    { name: 'Cosmetic', description: 'Whitening, veneers, and bonding', color: '#8B5CF6', icon: 'sparkles' },
    { name: 'Orthodontics', description: 'Braces and aligners', color: '#F59E0B', icon: 'align-center' },
    { name: 'Oral Surgery', description: 'Extractions and implants', color: '#EF4444', icon: 'scissors' },
    { name: 'Endodontics', description: 'Root canal treatments', color: '#EC4899', icon: 'activity' },
  ];

  for (const category of categories) {
    await prisma.treatmentCategory_model.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log('✅ Treatment categories created');

  // Get category IDs
  const preventiveCat = await prisma.treatmentCategory_model.findUnique({ where: { name: 'Preventive Care' } });
  const restorativeCat = await prisma.treatmentCategory_model.findUnique({ where: { name: 'Restorative' } });
  const cosmeticCat = await prisma.treatmentCategory_model.findUnique({ where: { name: 'Cosmetic' } });
  const orthodonticsCat = await prisma.treatmentCategory_model.findUnique({ where: { name: 'Orthodontics' } });
  const surgeryCat = await prisma.treatmentCategory_model.findUnique({ where: { name: 'Oral Surgery' } });
  const endodonticsCat = await prisma.treatmentCategory_model.findUnique({ where: { name: 'Endodontics' } });

  // Create treatments
  const treatments = [
    { name: 'Regular Checkup', description: 'Comprehensive dental examination', duration: 30, price: 75, categoryId: preventiveCat!.id, code: 'D0120' },
    { name: 'Teeth Cleaning', description: 'Professional dental cleaning', duration: 45, price: 120, categoryId: preventiveCat!.id, code: 'D1110' },
    { name: 'Fluoride Treatment', description: 'Preventive fluoride application', duration: 15, price: 35, categoryId: preventiveCat!.id, code: 'D1206' },
    { name: 'Dental Filling', description: 'Composite resin filling', duration: 45, price: 150, categoryId: restorativeCat!.id, code: 'D2391' },
    { name: 'Crown', description: 'Porcelain crown', duration: 60, price: 1200, categoryId: restorativeCat!.id, code: 'D2740' },
    { name: 'Bridge', description: 'Dental bridge', duration: 90, price: 2500, categoryId: restorativeCat!.id, code: 'D6740' },
    { name: 'Teeth Whitening', description: 'In-office whitening treatment', duration: 60, price: 400, categoryId: cosmeticCat!.id, code: 'D9972' },
    { name: 'Veneers', description: 'Porcelain veneers', duration: 60, price: 1500, categoryId: cosmeticCat!.id, code: 'D2960' },
    { name: 'Braces Consultation', description: 'Orthodontic consultation', duration: 45, price: 100, categoryId: orthodonticsCat!.id, code: 'D8660' },
    { name: 'Tooth Extraction', description: 'Simple tooth extraction', duration: 30, price: 200, categoryId: surgeryCat!.id, code: 'D7140' },
    { name: 'Dental Implant', description: 'Single tooth implant', duration: 120, price: 3000, categoryId: surgeryCat!.id, code: 'D6010' },
    { name: 'Root Canal', description: 'Root canal treatment', duration: 90, price: 800, categoryId: endodonticsCat!.id, code: 'D3310' },
  ];

  for (const treatment of treatments) {
    await prisma.treatment.upsert({
      where: { code: treatment.code },
      update: {},
      create: treatment,
    });
  }
  console.log('✅ Treatments created');

  // Create schedules for doctors
  const dentistStaff = await prisma.staff.findFirst({ where: { userId: dentist.id } });
  const specialistStaff = await prisma.staff.findFirst({ where: { userId: specialist.id } });
  const doctorStaff = await prisma.staff.findFirst({ where: { userId: doctor.id } });

  if (dentistStaff) {
    const days = [1, 2, 3, 4, 5]; // Monday to Friday
    for (const day of days) {
      await prisma.schedule.upsert({
        where: {
          staffId_dayOfWeek: {
            staffId: dentistStaff.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          staffId: dentistStaff.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
        },
      });
    }
    console.log('✅ Dentist schedule created');
  }

  if (specialistStaff) {
    const days = [1, 2, 3, 4]; // Monday to Thursday
    for (const day of days) {
      await prisma.schedule.upsert({
        where: {
          staffId_dayOfWeek: {
            staffId: specialistStaff.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          staffId: specialistStaff.id,
          dayOfWeek: day,
          startTime: '10:00',
          endTime: '16:00',
          isAvailable: true,
        },
      });
    }
    console.log('✅ Specialist schedule created');
  }

  if (doctorStaff) {
    const days = [1, 2, 3, 4, 5];
    for (const day of days) {
      await prisma.schedule.upsert({
        where: {
          staffId_dayOfWeek: {
            staffId: doctorStaff.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          staffId: doctorStaff.id,
          dayOfWeek: day,
          startTime: '09:30',
          endTime: '17:30',
          isAvailable: true,
        },
      });
    }
    console.log('✅ Doctor schedule created');
  }

  // Create sample appointment
  const patientProfile = await prisma.patient.findFirst({ where: { userId: patient.id } });
  const allPatients = [
    ...(patientProfile ? [{ id: patientProfile.id, userId: patient.id }] : []),
    ...testPatientProfiles,
  ];
  const doctorPool = [dentistStaff, specialistStaff, doctorStaff].filter(Boolean) as { id: string }[];
  
  if (patientProfile && dentistStaff) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientProfile.id,
        doctorId: dentistStaff.id,
        appointmentDate: tomorrow,
        startTime: '10:00',
        endTime: '10:30',
        type: AppointmentType.CHECKUP,
        status: AppointmentStatus.SCHEDULED,
        notes: 'Regular checkup',
        reason: 'Annual examination',
      },
    });
    console.log('✅ Sample appointment created');

      // Create sample invoice (idempotent)
      const existingInvoice = await prisma.invoice.findUnique({
        where: { invoiceNumber: 'INV-202401-0001' },
      });

      if (!existingInvoice) {
        await prisma.invoice.create({
          data: {
            invoiceNumber: 'INV-202401-0001',
            patientId: patientProfile.id,
            appointmentId: appointment.id,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            subtotal: 75,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 75,
            balanceDue: 75,
            status: PaymentStatus.PENDING,
            items: {
              create: {
                description: 'Regular Checkup',
                quantity: 1,
                unitPrice: 75,
                totalPrice: 75,
              },
            },
          },
        });
        console.log('✅ Sample invoice created');
      } else {
        console.log('✅ Sample invoice already exists');
      }
  }

  // Create additional appointments
  const timeSlots = [
    { start: '09:00', end: '09:30' },
    { start: '09:45', end: '10:15' },
    { start: '10:30', end: '11:00' },
    { start: '11:15', end: '11:45' },
    { start: '13:00', end: '13:30' },
    { start: '13:45', end: '14:15' },
    { start: '14:30', end: '15:00' },
    { start: '15:15', end: '15:45' },
  ];

  const createdAppointments = [];
  for (let i = 0; i < 40; i++) {
    const p = allPatients[i % allPatients.length];
    const d = doctorPool[i % doctorPool.length];
    const slot = timeSlots[i % timeSlots.length];
    const date = new Date();
    date.setDate(date.getDate() + (i % 20) + 1);

    const apt = await prisma.appointment.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        appointmentDate: date,
        startTime: slot.start,
        endTime: slot.end,
        type: AppointmentType.CHECKUP,
        status: AppointmentStatus.SCHEDULED,
        reason: 'Routine visit',
      },
    });
    createdAppointments.push(apt);
  }
  console.log('✅ Additional appointments created:', createdAppointments.length);

  // Create additional invoices
  await prisma.payment.deleteMany({
    where: {
      reference: {
        startsWith: 'RCPT-',
      },
    },
  });
  await prisma.invoice.deleteMany({
    where: {
      invoiceNumber: {
        startsWith: 'INV-TEST-',
      },
    },
  });

  const createdInvoices = [];
  for (let i = 0; i < Math.min(30, createdAppointments.length); i++) {
    const apt = createdAppointments[i];
    const invoiceNumber = `INV-TEST-${String(i + 1).padStart(4, '0')}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: apt.patientId,
        appointmentId: apt.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        subtotal: 120,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 120,
        balanceDue: 120,
        status: PaymentStatus.PENDING,
        createdById: admin.id,
        items: {
          create: {
            description: 'Checkup and cleaning',
            quantity: 1,
            unitPrice: 120,
            totalPrice: 120,
          },
        },
      },
    });
    createdInvoices.push(invoice);
  }
  console.log('✅ Additional invoices created:', createdInvoices.length);

  // Create additional payments
  for (let i = 0; i < Math.min(30, createdInvoices.length); i++) {
    const inv = createdInvoices[i];
    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        patientId: inv.patientId,
        amount: 120,
        method: PaymentMethod.CASH,
        reference: `RCPT-${String(i + 1).padStart(4, '0')}`,
        paymentDate: new Date(),
      },
    });
    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        paidAmount: 120,
        balanceDue: 0,
        status: PaymentStatus.PAID,
      },
    });
  }
  console.log('✅ Additional payments created: 30');

  // Create clinic settings
  const settings = [
    { key: 'clinic_name', value: 'Smile Care Dental Clinic', category: 'general', description: 'Clinic name displayed in the system' },
    { key: 'clinic_address', value: '123 Dental Street, Anytown, CA 12345', category: 'general', description: 'Clinic address' },
    { key: 'clinic_phone', value: '555-123-4567', category: 'general', description: 'Clinic phone number' },
    { key: 'clinic_email', value: 'info@dentalclinic.com', category: 'general', description: 'Clinic email address' },
    { key: 'appointment_reminder_hours', value: '24', category: 'notifications', description: 'Hours before appointment to send reminder' },
    { key: 'currency', value: 'USD', category: 'billing', description: 'Default currency' },
    { key: 'tax_rate', value: '0', category: 'billing', description: 'Default tax rate percentage' },
    { key: 'messaging_enabled', value: 'true', category: 'messaging', description: 'Enable/disable in-app messaging globally' },
    { key: 'messaging_allow_patient_to_staff', value: 'true', category: 'messaging', description: 'Allow patients to message clinic staff' },
    { key: 'messaging_allow_staff_to_patient', value: 'true', category: 'messaging', description: 'Allow staff to message patients' },
    { key: 'messaging_default_signature', value: 'Thanks, Dental Clinic Team', category: 'messaging', description: 'Default signature shown in examples' },
    { key: 'messaging_reply_sla_hours', value: '24', category: 'messaging', description: 'Target response SLA in hours' },
  ];

  for (const setting of settings) {
    await prisma.clinicSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Clinic settings created');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Default login credentials:');
  console.log('  Admin: admin@dentalclinic.com / admin123');
  console.log('  Receptionist: reception@dentalclinic.com / reception123');
    console.log('  Dentist: dentist@dentalclinic.com / dentist123');
    console.log('  Doctor: doctor@dentalclinic.com / doctor123');
  console.log('  Specialist: specialist@dentalclinic.com / specialist123');
  console.log('  Nurse: nurse@dentalclinic.com / nurse123');
  console.log('  Assistant: assistant@dentalclinic.com / assistant123');
  console.log('  Patient: patient@example.com / patient123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
