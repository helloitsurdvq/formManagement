const chai = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const db = require("../config");
const { getForms, createForm, getFormById, updateForm, deleteForm } = require("../controllers/form.controller");
const { createField, updateField, deleteField } = require("../controllers/field.controller");
const { getActiveForms, submitForm, getSubmissions } = require("../controllers/submit.controller");
const { login, logout } = require("../controllers/user.controller");
const { expect } = chai;

const createRes = () => ({
  status: sinon.stub().returnsThis(),
  json: sinon.stub().returnsThis(),
  send: sinon.stub().returnsThis(),
});

describe("Form management API test ", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: {} };
    res = createRes();
  });

  afterEach(() => {
    sinon.restore();
  });

  after((done) => {
    if (db && typeof db.end === "function") {
      db.end(() => done());
      return;
    }
    done();
  });

  describe("User Controller", () => {
    it("should login successfully and return token data", async () => {
      req.body = {
        email: "admin@test.com",
        password: "admin",
      };

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, [
          {
            id: 1,
            email: "admin@test.com",
            password: "admin",
            type_of_account: "admin",
          },
        ]);
      });

      sinon.stub(jwt, "sign").returns("mock-token");

      await login(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Login successfully",
          data: {
            user: {
              id: 1,
              email: "admin@test.com",
              type_of_account: "admin",
              role: "admin",
            },
            token: "mock-token",
          },
        }),
      ).to.be.true;
    });

    it("should return 401 when login credentials are invalid", async () => {
      req.body = {
        email: "admin@test.com",
        password: "wrong-password",
      };

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, [
          {
            id: 1,
            email: "admin@test.com",
            password: "admin",
            type_of_account: "admin",
          },
        ]);
      });

      await login(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(
        res.json.calledWith({ message: "Invalid email or password" }),
      ).to.be.true;
    });

    it("should logout successfully", () => {
      logout(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ message: "Logout successfully" })).to.be.true;
    });
  });

  describe("Form Controller", () => {
    it("should return all forms with status 200", async () => {
      const mockForms = [
        {
          id: 1,
          title: "Customer Feedback",
          form_description: "Feedback form",
          display_order: 1,
          form_status: "active",
          created_by: 1,
          created_at: "2026-04-23",
          updated_at: "2026-04-23",
        },
      ];

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, mockForms);
      });

      await getForms(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Get forms successfully",
          data: mockForms,
        }),
      ).to.be.true;
    });

    it("should create a form and return 201", async () => {
      req.body = {
        title: "Employee Leave Request",
        form_description: "Leave request form",
        display_order: 2,
        form_status: "draft",
        created_by: 1,
      };

      const queryStub = sinon.stub(db, "query");
      queryStub.onCall(0).callsFake((sql, params, callback) => {
        callback(null, { insertId: 10 });
      });
      queryStub.onCall(1).callsFake((sql, params, callback) => {
        callback(null, [
          {
            id: 10,
            title: "Employee Leave Request",
            form_description: "Leave request form",
            display_order: 2,
            form_status: "draft",
            created_by: 1,
            created_at: "2026-04-23",
            updated_at: "2026-04-23",
          },
        ]);
      });
      queryStub.onCall(2).callsFake((sql, params, callback) => {
        callback(null, []);
      });

      await createForm(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Create form successfully",
          data: {
            id: 10,
            title: "Employee Leave Request",
            fields: [],
          },
        }),
      ).to.be.true;
    });

    it("should return 404 when getting a form by missing id", async () => {
      req.params = { id: "99" };

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, []);
      });

      await getFormById(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: "Form not found" })).to.be.true;
    });

    it("should update a form and return 200", async () => {
      req.params = { id: "1" };
      req.body = { title: "Updated title", form_status: "active" };

      const queryStub = sinon.stub(db, "query");
      queryStub.onCall(0).callsFake((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });
      queryStub.onCall(1).callsFake((sql, params, callback) => {
        callback(null, [
          {
            id: 1,
            title: "Updated title",
            form_description: null,
            display_order: 0,
            form_status: "active",
            created_by: 1,
            created_at: "2026-04-23",
            updated_at: "2026-04-23",
          },
        ]);
      });
      queryStub.onCall(2).callsFake((sql, params, callback) => {
        callback(null, []);
      });

      await updateForm(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Update form successfully",
          data: {
            id: 1,
            title: "Updated title",
          },
        }),
      ).to.be.true;
    });

    it("should delete a form and return 200", async () => {
      req.params = { id: "1" };

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      await deleteForm(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith({ message: "Delete form successfully" }),
      ).to.be.true;
    });
  });

  describe("Field Controller", () => {
    it("should create a select field with options and return 201", async () => {
      req.params = { id: "1" };
      req.body = {
        label: "Department",
        field_type: "select",
        display_order: 1,
        is_required: true,
        options: [
          { option_label: "IT", option_value: "it", display_order: 1 },
          { option_label: "HR", option_value: "hr", display_order: 2 },
        ],
      };

      sinon.stub(db, "beginTransaction").callsFake((callback) => callback(null));
      sinon.stub(db, "commit").callsFake((callback) => callback(null));
      sinon.stub(db, "rollback").callsFake((callback) => callback && callback());
      const queryStub = sinon.stub(db, "query");
      queryStub.onCall(0).callsFake((sql, params, callback) => callback(null, [{ id: 1 }]));
      queryStub.onCall(1).callsFake((sql, params, callback) => callback(null, { insertId: 7 }));
      queryStub.onCall(2).callsFake((sql, params, callback) => callback(null, { insertId: 1 }));
      queryStub.onCall(3).callsFake((sql, params, callback) => callback(null, { insertId: 2 }));
      queryStub.onCall(4).callsFake((sql, params, callback) =>
        callback(null, [
          {
            id: 7,
            form_id: 1,
            label: "Department",
            field_type: "select",
            display_order: 1,
            is_required: 1,
            max_length: null,
            min_value: null,
            max_value: null,
            allow_past_date: 0,
            created_at: "2026-04-23",
            updated_at: "2026-04-23",
          },
        ]),
      );
      queryStub.onCall(5).callsFake((sql, params, callback) =>
        callback(null, [
          {
            id: 1,
            field_id: 7,
            option_label: "IT",
            option_value: "it",
            display_order: 1,
            created_at: "2026-04-23",
          },
          {
            id: 2,
            field_id: 7,
            option_label: "HR",
            option_value: "hr",
            display_order: 2,
            created_at: "2026-04-23",
          },
        ]),
      );

      await createField(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Create field successfully",
          data: {
            id: 7,
            label: "Department",
            field_type: "select",
          },
        }),
      ).to.be.true;
    });

    it("should return 400 for invalid field type on create", async () => {
      req.params = { id: "1" };
      req.body = {
        label: "Wrong",
        field_type: "email",
      };

      await createField(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "field_type must be text, number, date, color, or select",
        }),
      ).to.be.true;
    });

    it("should update a field and return 200", async () => {
      req.params = { id: "1", fid: "7" };
      req.body = { label: "Department Name" };

      sinon.stub(db, "beginTransaction").callsFake((callback) => callback(null));
      sinon.stub(db, "commit").callsFake((callback) => callback(null));
      sinon.stub(db, "rollback").callsFake((callback) => callback && callback());

      const queryStub = sinon.stub(db, "query");
      queryStub.onCall(0).callsFake((sql, params, callback) =>
        callback(null, [
          {
            id: 7,
            form_id: 1,
            label: "Department",
            field_type: "text",
            display_order: 1,
            is_required: 1,
            max_length: 100,
            min_value: null,
            max_value: null,
            allow_past_date: 0,
            created_at: "2026-04-23",
            updated_at: "2026-04-23",
          },
        ]),
      );
      queryStub.onCall(1).callsFake((sql, params, callback) => callback(null, []));
      queryStub.onCall(2).callsFake((sql, params, callback) => callback(null, { affectedRows: 1 }));
      queryStub.onCall(3).callsFake((sql, params, callback) => callback(null, { affectedRows: 0 }));
      queryStub.onCall(4).callsFake((sql, params, callback) =>
        callback(null, [
          {
            id: 7,
            form_id: 1,
            label: "Department Name",
            field_type: "text",
            display_order: 1,
            is_required: 1,
            max_length: 100,
            min_value: null,
            max_value: null,
            allow_past_date: 0,
            created_at: "2026-04-23",
            updated_at: "2026-04-23",
          },
        ]),
      );
      queryStub.onCall(5).callsFake((sql, params, callback) => callback(null, []));

      await updateField(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Update field successfully",
          data: { id: 7, label: "Department Name" },
        }),
      ).to.be.true;
    });

    it("should delete a field and return 200", async () => {
      req.params = { id: "1", fid: "7" };

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, { affectedRows: 1 });
      });

      await deleteField(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWith({ message: "Delete field successfully" }),
      ).to.be.true;
    });
  });

  describe("Submit Controller", () => {
    it("should return active forms with fields", async () => {
      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, [
          {
            id: 1,
            title: "Feedback",
            form_description: "Feedback form",
            display_order: 1,
            form_status: "active",
            created_by: 1,
            created_at: "2026-04-23",
            updated_at: "2026-04-23",
            field_id: 5,
            label: "Name",
            field_type: "text",
            field_display_order: 1,
            is_required: 1,
            max_length: 100,
            min_value: null,
            max_value: null,
            allow_past_date: 0,
            option_id: null,
            option_label: null,
            option_value: null,
            option_display_order: null,
          },
        ]);
      });

      await getActiveForms(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Get active forms successfully",
        }),
      ).to.be.true;
    });

    it("should submit a form successfully", async () => {
      req.params = { id: "1" };
      req.user = { id: 2, role: "worker" };
      req.body = {
        values: {
          11: "Nguyen Van A",
          12: 20,
        },
      };

      sinon.stub(db, "beginTransaction").callsFake((callback) => callback(null));
      sinon.stub(db, "commit").callsFake((callback) => callback(null));
      sinon.stub(db, "rollback").callsFake((callback) => callback && callback());

      const queryStub = sinon.stub(db, "query");
      queryStub.onCall(0).callsFake((sql, params, callback) =>
        callback(null, [{ id: 1, form_status: "active" }]),
      );
      queryStub.onCall(1).callsFake((sql, params, callback) =>
        callback(null, [
          {
            id: 11,
            form_id: 1,
            label: "Full name",
            field_type: "text",
            display_order: 1,
            is_required: 1,
            max_length: 100,
            min_value: null,
            max_value: null,
            allow_past_date: 0,
            option_id: null,
            option_value: null,
          },
          {
            id: 12,
            form_id: 1,
            label: "Age",
            field_type: "number",
            display_order: 2,
            is_required: 1,
            max_length: null,
            min_value: 0,
            max_value: 100,
            allow_past_date: 0,
            option_id: null,
            option_value: null,
          },
        ]),
      );
      queryStub.onCall(2).callsFake((sql, params, callback) =>
        callback(null, { insertId: 30 }),
      );
      queryStub.onCall(3).callsFake((sql, params, callback) =>
        callback(null, { insertId: 101 }),
      );
      queryStub.onCall(4).callsFake((sql, params, callback) =>
        callback(null, { insertId: 102 }),
      );

      await submitForm(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Submit form successfully",
          data: {
            id: 30,
            form_id: 1,
            submitted_by: 2,
          },
        }),
      ).to.be.true;
    });

    it("should return 400 when required submission value is missing", async () => {
      req.params = { id: "1" };
      req.user = { id: 2, role: "worker" };
      req.body = { values: {} };

      const queryStub = sinon.stub(db, "query");
      queryStub.onCall(0).callsFake((sql, params, callback) =>
        callback(null, [{ id: 1, form_status: "active" }]),
      );
      queryStub.onCall(1).callsFake((sql, params, callback) =>
        callback(null, [
          {
            id: 11,
            form_id: 1,
            label: "Full name",
            field_type: "text",
            display_order: 1,
            is_required: 1,
            max_length: 100,
            min_value: null,
            max_value: null,
            allow_past_date: 0,
            option_id: null,
            option_value: null,
          },
        ]),
      );

      await submitForm(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Full name is required",
        }),
      ).to.be.true;
    });

    it("should return all submissions for admin", async () => {
      req.user = { id: 1, role: "admin" };

      sinon.stub(db, "query").callsFake((sql, params, callback) => {
        callback(null, [
          {
            submission_id: 1,
            form_id: 2,
            form_title: "Feedback",
            submitted_by: 3,
            submitted_by_email: "worker@test.com",
            submitted_at: "2026-04-23 10:00:00",
            value_id: 6,
            field_id: 11,
            label: "Full name",
            field_type: "text",
            value_text: "Nguyen Van A",
            value_number: null,
            value_date: null,
          },
        ]);
      });

      await getSubmissions(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(
        res.json.calledWithMatch({
          message: "Get submissions successfully",
        }),
      ).to.be.true;
    });
  });
});