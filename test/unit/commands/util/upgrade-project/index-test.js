const { expect } = require('chai');
const path = require('path');
const sinon = require('sinon');

const UpgradeProjectCommand = require('@src/commands/util/upgrade-project/index');
const helper = require('@src/commands/util/upgrade-project/helper');
const hostedSkillHelper = require('@src/commands/util/upgrade-project/hosted-skill-helper');
const optionModel = require('@src/commands/option-model');
const CLiError = require('@src/exceptions/cli-error');
const Messenger = require('@src/view/messenger');
const profileHelper = require('@src/utils/profile-helper');

describe('Commands init test - command class test', () => {
    const TEST_PROFILE = 'default';
    const TEST_ERROR = 'upgrade project error';
    const TEST_SKILL_ID = 'skillId';
    const FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'hosted-skill-resources-config.json');
    const FIXTURE_RESOURCES_CONFIG = path.join(process.cwd(), 'test', 'unit', 'fixture', 'model', 'upgrade-resources-config.json');
    let infoStub;
    let errorStub;
    let warnStub;

    beforeEach(() => {
        infoStub = sinon.stub();
        errorStub = sinon.stub();
        warnStub = sinon.stub();
        sinon.stub(Messenger, 'getInstance').returns({
            info: infoStub,
            error: errorStub,
            warn: warnStub
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('| validate command information is set correctly', () => {
        const instance = new UpgradeProjectCommand(optionModel);
        expect(instance.name()).equal('upgrade-project');
        expect(instance.description()).equal('upgrade the v1 ask-cli skill project to v2 structure');
        expect(instance.requiredOptions()).deep.equal([]);
        expect(instance.optionalOptions()).deep.equal(['profile', 'debug']);
    });

    describe('validate command handle', () => {
        const TEST_CMD = {
            profile: TEST_PROFILE
        };

        describe('command handle - pre upgrade check', () => {
            let instance;

            beforeEach(() => {
                instance = new UpgradeProjectCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| when profile is not correct, expect throw error', (done) => {
                // setup
                profileHelper.runtimeProfile.throws(new Error('error'));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal('error');
                    expect(errorStub.args[0][0].message).equal('error');
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| when extract upgrade information fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'extractUpgradeInformation').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper preview upgrade fails, expect throw error', (done) => {
                // setup
                sinon.stub(helper, 'extractUpgradeInformation');
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper preview Upgrade without previewConfirm, expect throw information', (done) => {
                // setup
                sinon.stub(helper, 'extractUpgradeInformation');
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, null);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('Command upgrade-project aborted.');
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - create V2 hosted skill project', () => {
            let instance;

            beforeEach(() => {
                instance = new UpgradeProjectCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| helper move old project to legacy folder fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    isHosted: true,
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hostedSkillHelper create V2 project skeleton fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    isHosted: true,
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(hostedSkillHelper, 'createV2ProjectSkeleton').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hostedSkillHelper download skill package fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    isHosted: true,
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(hostedSkillHelper, 'createV2ProjectSkeleton');
                sinon.stub(path, 'join').returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
                sinon.stub(hostedSkillHelper, 'downloadSkillPackage').callsArgWith(5, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hostedSkillHelper handle existing Lambda code fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    isHosted: true,
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(hostedSkillHelper, 'createV2ProjectSkeleton');
                sinon.stub(path, 'join').returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
                sinon.stub(hostedSkillHelper, 'downloadSkillPackage').callsArgWith(5, null);
                sinon.stub(hostedSkillHelper, 'handleExistingLambdaCode').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hosted skill project migration succeeds , expect no error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    isHosted: true,
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(hostedSkillHelper, 'createV2ProjectSkeleton');
                sinon.stub(path, 'join').returns(FIXTURE_HOSTED_SKILL_RESOURCES_CONFIG);
                sinon.stub(hostedSkillHelper, 'downloadSkillPackage').callsArgWith(5, null);
                sinon.stub(hostedSkillHelper, 'handleExistingLambdaCode');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('Project migration finished.');
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });

        describe('command handle - create V2 Non hosted skill project', () => {
            let instance;

            beforeEach(() => {
                instance = new UpgradeProjectCommand(optionModel);
                sinon.stub(profileHelper, 'runtimeProfile').returns(TEST_PROFILE);
            });

            afterEach(() => {
                sinon.restore();
            });

            it('| helper move old project to legacy folder fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper create V2 project skeleton fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(helper, 'createV2ProjectSkeleton').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| helper download skill package fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(helper, 'createV2ProjectSkeleton');
                sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG);
                sinon.stub(helper, 'downloadSkillPackage').callsArgWith(5, TEST_ERROR);
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(TEST_ERROR);
                    expect(errorStub.args[0][0]).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hostedSkillHelper handle existing Lambda code fails, expect throw error', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(helper, 'createV2ProjectSkeleton');
                sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG);
                sinon.stub(helper, 'downloadSkillPackage').callsArgWith(5, null);
                sinon.stub(helper, 'handleExistingLambdaCode').throws(new CLiError(TEST_ERROR));
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err.message).equal(TEST_ERROR);
                    expect(errorStub.args[0][0].message).equal(TEST_ERROR);
                    expect(infoStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });

            it('| hosted skill project migration succeeds , expect no error thrown', (done) => {
                // setup
                const TEST_USER_INPUT = {
                    skillId: TEST_SKILL_ID
                };
                sinon.stub(helper, 'extractUpgradeInformation').returns(TEST_USER_INPUT);
                sinon.stub(helper, 'previewUpgrade').callsArgWith(1, null, true);
                sinon.stub(helper, 'moveOldProjectToLegacyFolder');
                sinon.stub(helper, 'createV2ProjectSkeleton');
                sinon.stub(path, 'join').returns(FIXTURE_RESOURCES_CONFIG);
                sinon.stub(helper, 'downloadSkillPackage').callsArgWith(5, null);
                sinon.stub(helper, 'handleExistingLambdaCode');
                // call
                instance.handle(TEST_CMD, (err) => {
                    // verify
                    expect(err).equal(undefined);
                    expect(infoStub.args[0][0]).equal('Project migration finished.');
                    expect(errorStub.callCount).equal(0);
                    expect(warnStub.callCount).equal(0);
                    done();
                });
            });
        });
    });
});
