const { Sequelize } = require('sequelize');
const { Op ,literal } = require("sequelize");
const crypto = require("crypto");
const sequelize = require("../../../sequelize/sequelize");
const models = sequelize.models;
/*******************************************************/
//*******************************************************/
const addMember = async function (req, res, next) {
    try {
        let memberInstance = new sequelize.db(models.enterprise_members);
        let user_id = req.user_id;
        const {name, email, authority, device_id, device_name} = req.body;
        //-----------//
        let userObject = {
            email: email,
            name: name,
            authority: authority,
            device_id: device_id,
            device_name: device_name,
            enterprise_user_id: user_id
        }
        let [member, error] = await memberInstance.create(userObject);
        if (error) { return next(error); }
        return next(member);
    }
    catch (error) { return next(error); }
};
const editMember = async function (req, res, next) {
    try {
        let memberInstance = new sequelize.db(models.enterprise_members);
        let user_id = req.user_id;
        const {member_id, name, email, authority, device_id, device_name} = req.body;
        let [member, err] = await memberInstance.findOne({ where: { id: member_id } });
        if (err) { return [undefined, err]; }
        if (member) {
            memberInstance.model = member;
            memberInstance.update({ name: name,email:email,authority:authority ,device_id: device_id, device_name: device_name});
            return next(member);
        }
        return next(member);
    }
    catch (error) { return next(error); }
};
const getMemberList = async function (req, res, next) {
    try {
        let id = req.user_id;
        //-----recommended---//
        let findQueryR = {
            where: {
                enterprise_user_id: id,
                deleted_at: null
            }
        }
        let memberInstanceR = new sequelize.db(models.enterprise_members);
        let [members, Rerror] = await memberInstanceR.findAll(findQueryR);
        return next(members); 
    }
    catch (error) { return next(error); }
};
const deleteMember = async function (req, res, next) {
try {
    let member_id = req.query.member_id;
    let whereauthkey = {
        where: { id: member_id }
    };
    try {
        let member = await models.enterprise_members.findOne(whereauthkey);
        if (member) {
            await member.destroy();
            console.log(`Member with ID ${member_id} deleted successfully.`);
            return next();
        } else {
            console.log(`No member found with ID ${member_id}.`);
            return next(404);
        }
    } catch (error) {
        console.error("Error deleting member:", error);
        return next(error);
    }
}
    catch (error) { return next(error); }
};
const deleteDevice = async function (req, res, next) {
try {
    let member_id = req.query.member_id;
    let whereauthkey = {
        where: { id: member_id }
    };
    try {
        let member = await models.enterprise_members.findOne(whereauthkey);
        if (member) {
            member.device_id = null;
            member.device_name = null;
            await member.save();
            console.log(`Member with ID ${member_id} updated successfully.`);
            return next(member);
        } else {
            console.log(`No member found with ID ${member_id}.`);
            return next(404);
        }
    } catch (error) {
        console.error("Error updating member:", error);
        return next(error);
    }
}
    catch (error) { return next(error); }
};
const setCompanyName = async function (req, res, next) {
    try {
        let companyInstance = new sequelize.db(models.enterprise_companies);
        let user_id = req.user_id;
        const {name} = req.body;
        //-----------//
        let userObject = {
            name: name,
            enterprise_user_id: user_id
        }
        let [company, error] = await companyInstance.create(userObject);
        if (error) { return next(error); }
        return next(company);
    }
    catch (error) { return next(error); }
};
const getCompaniesList = async function (req, res, next) {
    try {
        let id = req.user_id;
        //-----recommended---//
        let findQueryR = {
            where: {
                enterprise_user_id: id,
                deleted_at: null
            }
        }
        let companyInstanceR = new sequelize.db(models.enterprise_companies);
        let [company, Rerror] = await companyInstanceR.findAll(findQueryR);
        if(!company){
            return next(404);
        }
        return next(company); 
    }
    catch (error) { return next(error); }
};
const addPlanDetails = async function (req, res, next) {
    try {
        let planInstance = new sequelize.db(models.enterprise_plan_details);
        let user_id = req.user_id;
        const {members_limit, devices_limit, company_id} = req.body;
        //-----------//
        let userObject = {
            members_limit: members_limit,
            devices_limit: devices_limit,
            company_id: company_id,
            enterprise_user_id: user_id
        }
        let [company, error] = await planInstance.create(userObject);
        if (error) { return next(error); }
        return next(company);
    }
    catch (error) { return next(error); }
};
const getPlanList = async function (req, res, next) {
    try {
        let id = req.user_id;
        //-----recommended---//
        let findQueryR = {
            where: {
                enterprise_user_id: id,
                deleted_at: null
            }
        }
        let planInstanceR = new sequelize.db(models.enterprise_plan_details);
        let [plans, Rerror] = await planInstanceR.findAll(findQueryR);
        if(!plans){
            return next(404);
        }
        return next(plans); 
    }
    catch (error) { return next(error); }
};
const enterpriseDashboardDetails = async function (req, res, next) {
    try {
        let user_id = req.user_id;
        let ress = await sequelize.connection.query(`
        SELECT u.id, u.user_name, COUNT(ui.user_id) AS invitations_count
        FROM referral_users ui
        INNER JOIN users u ON u.id = ui.referral_user_id
        GROUP BY u.id
        `);
        let results = ress[0];
        // let v_name = results.name;
        // results.version_name = v_name;
        return next(results);
        }
    catch(error){
        console.log(error);
        return next(error)
    }
};
const withdrawHistory = async function (req, res, next) {
    try {
        let id = req.user_id;
        //-----recommended---//
        let findQueryR = {
            where: {
                type: 'Withdrawn',
                deleted_at: null
            }
        }
        let entListInstanceR = new sequelize.db(models.enterprise_users_transactions);
        let [list, Rerror] = await entListInstanceR.findAll(findQueryR);
        if(!list){
            return next(404);
        }
        return next(list); 
    }
    catch (error) { return next(error); }
};
module.exports = {
    addMember,
    editMember,
    getMemberList,
    deleteMember,
    deleteDevice,
    setCompanyName,
    getCompaniesList,
    addPlanDetails,
    getPlanList,
    enterpriseDashboardDetails,
    withdrawHistory
};