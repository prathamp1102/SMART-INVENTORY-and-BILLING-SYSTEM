const Warranty       = require("../models/WarrantyModel");
const ServiceRequest = require("../models/ServiceRequestModel");
const Product        = require("../models/Productmodel");
const mongoose       = require("mongoose");

// Helper: safely get user ID as string from JWT (JWT stores 'id', not '_id')
// Helper: safely get user ID from JWT (JWT stores 'id', not '_id')
const getUserId = (req) => req.user._id || req.user.id;

/* ══════════════════════════════════════════════════════════
   WARRANTY
══════════════════════════════════════════════════════════ */

// POST /api/service/warranty  — Register a warranty
exports.registerWarranty = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const {
      productName, serialNumber, purchaseDate,
      warrantyYears = 1, invoiceNo = "", notes = "", productId,
    } = req.body;

    if (!productName?.trim())  return res.status(400).json({ message: "Product name is required" });
    if (!serialNumber?.trim()) return res.status(400).json({ message: "Serial number is required" });
    if (!purchaseDate)         return res.status(400).json({ message: "Purchase date is required" });

    // Prevent duplicate serial number per customer
    const existing = await Warranty.findOne({ customer: customerId, serialNumber: serialNumber.trim() });
    if (existing) {
      return res.status(400).json({ message: `Warranty already registered for serial number "${serialNumber}"` });
    }

    // Calculate expiry date and initial status here (no pre-save hook)
    const parsedPurchaseDate = new Date(purchaseDate);
    const expiryDate = new Date(parsedPurchaseDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + Number(warrantyYears));
    const status = new Date() > expiryDate ? "EXPIRED" : "ACTIVE";

    const warranty = await Warranty.create({
      customer:      customerId,
      product:       productId || null,
      productName:   productName.trim(),
      serialNumber:  serialNumber.trim(),
      purchaseDate:  parsedPurchaseDate,
      warrantyYears: Number(warrantyYears),
      expiryDate,
      status,
      invoiceNo:     invoiceNo.trim(),
      branch:        req.userBranch || null,
      notes:         notes.trim(),
    });

    res.status(201).json({ message: "Warranty registered successfully", warranty });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/service/warranty  — Customer's own warranties
exports.getMyWarranties = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const warranties = await Warranty.find({ customer: customerId })
      .populate({ path: "product", select: "name barcode" })
      .sort({ createdAt: -1 });

    // Refresh expired status
    const now = new Date();
    const updated = warranties.map(w => {
      const obj = w.toObject();
      if (obj.expiryDate && now > obj.expiryDate && obj.status === "ACTIVE") {
        obj.status = "EXPIRED";
      }
      const msLeft = obj.expiryDate ? new Date(obj.expiryDate) - now : 0;
      obj.daysLeft  = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      return obj;
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/service/warranty/:id — Single warranty
exports.getWarranty = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const filter = req.user.role === "CUSTOMER"
      ? { _id: req.params.id, customer: customerId }
      : { _id: req.params.id };

    const warranty = await Warranty.findOne(filter)
      .populate({ path: "customer", select: "name email phone" })
      .populate({ path: "product",  select: "name barcode" });

    if (!warranty) return res.status(404).json({ message: "Warranty not found" });
    res.json(warranty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: GET /api/service/warranty/all — All warranties
exports.getAllWarranties = async (req, res) => {
  try {
    const warranties = await Warranty.find()
      .populate({ path: "customer", select: "name email phone" })
      .populate({ path: "product",  select: "name barcode" })
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(warranties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: PATCH /api/service/warranty/:id — Update status
exports.updateWarrantyStatus = async (req, res) => {
  try {
    const warranty = await Warranty.findById(req.params.id);
    if (!warranty) return res.status(404).json({ message: "Warranty not found" });
    if (req.body.status) warranty.status = req.body.status;
    if (req.body.notes !== undefined) warranty.notes = req.body.notes;
    await warranty.save();
    res.json({ message: "Warranty updated", warranty });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* ══════════════════════════════════════════════════════════
   SERVICE REQUESTS
══════════════════════════════════════════════════════════ */

// POST /api/service/requests  — Raise a service request
exports.raiseServiceRequest = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const {
      productName, serialNumber = "", issueType = "OTHER",
      issueDescription, priority = "MEDIUM",
      contactName, contactPhone, contactAddress = "",
      preferredDate, warrantyId,
    } = req.body;

    if (!productName?.trim())     return res.status(400).json({ message: "Product name is required" });
    if (!issueDescription?.trim()) return res.status(400).json({ message: "Issue description is required" });
    if (!contactName?.trim())     return res.status(400).json({ message: "Contact name is required" });
    if (!contactPhone?.trim())    return res.status(400).json({ message: "Contact phone is required" });

    const count = await ServiceRequest.countDocuments();
    const ticketNo = `SRQ-${String(count + 1).padStart(5, "0")}`;

    const request = await ServiceRequest.create({
      ticketNo,
      customer:         customerId,
      warranty:         warrantyId || null,
      branch:           req.userBranch || null,
      productName:      productName.trim(),
      serialNumber:     serialNumber.trim(),
      issueType,
      issueDescription: issueDescription.trim(),
      priority,
      contactName:      contactName.trim(),
      contactPhone:     contactPhone.trim(),
      contactAddress:   contactAddress.trim(),
      preferredDate:    preferredDate ? new Date(preferredDate) : null,
      statusHistory: [{
        status:    "SUBMITTED",
        note:      "Service request submitted by customer",
        updatedBy: customerId,
      }],
    });

    res.status(201).json({ message: "Service request raised successfully", request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/service/requests  — Customer's own requests
exports.getMyServiceRequests = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const requests = await ServiceRequest.find({ customer: customerId })
      .populate({ path: "warranty", select: "productName serialNumber expiryDate" })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/service/requests/:id — Single request (customer owns it or admin)
exports.getServiceRequest = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const filter = req.user.role === "CUSTOMER"
      ? { _id: req.params.id, customer: customerId }
      : { _id: req.params.id };

    const request = await ServiceRequest.findOne(filter)
      .populate({ path: "customer", select: "name email phone" })
      .populate({ path: "warranty", select: "productName serialNumber expiryDate status" });

    if (!request) return res.status(404).json({ message: "Service request not found" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: GET /api/service/requests/all — All requests
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    const requests = await ServiceRequest.find(filter)
      .populate({ path: "customer", select: "name email phone" })
      .populate({ path: "warranty", select: "productName serialNumber" })
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin/Staff: PATCH /api/service/requests/:id — Update status + assign
exports.updateServiceRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Service request not found" });

    const updatedBy = getUserId(req);
    const { status, note, assignedTo, resolutionNote } = req.body;

    if (status && status !== request.status) {
      request.status = status;
      request.statusHistory.push({
        status,
        note:      note || "",
        updatedBy,
        updatedAt: new Date(),
      });
    }
    if (assignedTo !== undefined)    request.assignedTo     = assignedTo;
    if (resolutionNote !== undefined) request.resolutionNote = resolutionNote;

    await request.save();
    res.json({ message: "Service request updated", request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Customer: PATCH /api/service/requests/:id/cancel
exports.cancelServiceRequest = async (req, res) => {
  try {
    const customerId = getUserId(req);
    const request = await ServiceRequest.findOne({ _id: req.params.id, customer: customerId });
    if (!request) return res.status(404).json({ message: "Service request not found" });
    if (["RESOLVED", "CLOSED", "CANCELLED"].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${request.status.toLowerCase()} request` });
    }

    request.status = "CANCELLED";
    request.statusHistory.push({
      status:    "CANCELLED",
      note:      "Cancelled by customer",
      updatedBy: customerId,
      updatedAt: new Date(),
    });
    await request.save();
    res.json({ message: "Service request cancelled", request });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
