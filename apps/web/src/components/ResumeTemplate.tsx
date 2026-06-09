import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
    family: 'Prompt',
    src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/prompt/Prompt-Regular.ttf',
    fontWeight: 'normal',
});
Font.register({
    family: 'PromptBold',
    src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/prompt/Prompt-Bold.ttf',
    fontWeight: 'bold',
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        fontFamily: 'Prompt',
        backgroundColor: '#FFFFFF',
    },
    // --- คอลัมน์ซ้าย (Sidebar) ---
    leftColumn: {
        width: '32%',
        backgroundColor: '#1e3a8a',
        color: '#FFFFFF',
        padding: 20,
        height: '100%',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        objectFit: 'cover',
    },
    sidebarSection: {
        marginBottom: 12,
    },
    line: {
        height: 1.5,
        backgroundColor: '#FFFFFF',
        width: '100%',
        marginTop: 10,
        marginBottom: 10,
        opacity: 0.5,
    },
    sidebarTitle: {
        fontSize: 12,
        fontFamily: 'PromptBold',
        color: '#FFFFFF',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sidebarLabel: {
        fontSize: 8,
        fontFamily: 'PromptBold',
        color: '#93c5fd',
        marginTop: 6,
    },
    sidebarText: {
        fontSize: 9.5,
        fontFamily: 'Prompt',
        color: '#FFFFFF',
        lineHeight: 1.4,
    },
    langVerticalItem: {
        width: '100%',
        marginBottom: 8,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'flex-start',
    },
    bulletPoint: {
        width: 10,
        fontSize: 10,
        color: '#FFFFFF',
    },
    rightColumn: {
        width: '68%',
        padding: '25 30',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
    },
    userName: {
        fontSize: 26,
        fontFamily: 'PromptBold',
        color: '#1e3a8a',
        marginBottom: 5,
    },
    mainSectionTitle: {
        fontSize: 14,
        fontFamily: 'PromptBold',
        color: '#1e3a8a',
        marginTop: 15,
        marginBottom: 10,
        paddingBottom: 2,
        borderBottomWidth: 1.5,
        borderBottomColor: '#1e3a8a',
    },
    itemBlock: {
        marginBottom: 12,
    },
    itemTitle: {
        fontSize: 12,
        fontFamily: 'PromptBold',
        color: '#111827',
    },
    itemSub: {
        fontSize: 10,
        color: '#2563eb',
        fontFamily: 'PromptBold',
        marginBottom: 2,
    },
    itemDesc: {
        fontSize: 10,
        fontFamily: 'Prompt',
        color: '#4b5563',
        lineHeight: 1.5,
    },
    footerContact: {
        marginTop: 'auto',
        paddingTop: 15,
    },
    footerTitle: {
        fontSize: 12,
        fontFamily: 'PromptBold',
        color: '#1e3a8a',
        marginBottom: 4,
    },
    singleLine: {
        height: 1,
        backgroundColor: '#e2e8f0',
        width: '100%',
        marginBottom: 10,
    },
    contactInfoRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    contactLabel: {
        fontSize: 9,
        fontFamily: 'PromptBold',
        color: '#1e3a8a',
        width: 45,
    },
    contactValue: {
        fontSize: 9,
        color: '#475569',
        flex: 1,
    }
});

export const ResumeTemplate = ({ data }: { data: any }) => {
    if (!data) return null;

    const profile = data.profile || data;

    const targetPosition =
        data.targetPosition ||
        (data.jobPreferences && data.jobPreferences[0]?.position) ||
        "พร้อมเริ่มงาน";

    const expYears = data.totalExperienceYear || 0;
    const expDisplay = expYears > 0 ? `${expYears} ปี` : "แรกเข้า / นักศึกษาจบใหม่";
    const isBKK = profile.province?.includes('กรุงเทพ');
    const addressParts = [
        profile.address,
        (profile.subDistrict || profile.sub_district) ? `${isBKK ? 'แขวง' : 'ต.'}${profile.subDistrict || profile.sub_district}` : '',
        (profile.district || profile.district_name) ? `${isBKK ? 'เขต' : 'อ.'}${profile.district || profile.district_name}` : '',
        profile.province,
        profile.zipCode || profile.postalCode || profile.postal_code
    ].filter(Boolean).join('  ');

    const displayName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';

    return (
        <Document title={`Resume - ${displayName}`}>
            <Page size="A4" style={styles.page}>

                {/* --- Sidebar (Left) --- */}
                <View style={styles.leftColumn}>
                    <View style={styles.avatarContainer}>
                        {data.avatarUrl && <Image src={data.avatarUrl} style={styles.profileImage} />}
                    </View>

                    <View style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>Personal Details</Text>
                        <Text style={styles.sidebarLabel}>AGE / GENDER</Text>
                        <Text style={styles.sidebarText}>{`${profile.age || data.age || '-'} ปี / ${profile.gender || data.gender || '-'}`}</Text>
                        <Text style={styles.sidebarLabel}>HT / WT</Text>
                        <Text style={styles.sidebarText}>{`${profile.height || '-'} ซม. / ${profile.weight || '-'} กก.`}</Text>
                        <Text style={styles.sidebarLabel}>MILITARY STATUS</Text>
                        <Text style={styles.sidebarText}>{profile.militaryStatus || profile.military_status || '-'}</Text>
                        <View style={styles.line} />
                    </View>

                    <View style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>Driving Skills</Text>
                        {data.drivingSkills?.length > 0 ? data.drivingSkills.map((skill: any, i: number) => (
                            <View key={i} style={styles.bulletItem}>
                                <Text style={styles.bulletPoint}>•</Text>
                                <Text style={styles.sidebarText}>
                                    {typeof skill === 'string' ? skill : `${skill.skillType || ''} ${skill.category ? `(${skill.category})` : ''}`}
                                </Text>
                            </View>
                        )) : <Text style={styles.sidebarText}>-</Text>}
                        <View style={styles.line} />
                    </View>

                    <View style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>Languages</Text>
                        {data.languages?.map((lang: any, i: number) => (
                            <View key={i} style={styles.langVerticalItem}>
                                <Text style={[styles.sidebarText, { fontFamily: 'PromptBold' }]}>{lang.language}</Text>
                                <Text style={{ fontSize: 8.5, color: '#93c5fd', fontFamily: 'Prompt' }}>{`ระดับ: ${lang.level || '-'}`}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* --- Main Content (Right) --- */}
                <View style={styles.rightColumn}>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={styles.userName}>{displayName}</Text>
                        <Text style={{ fontSize: 14, fontFamily: 'PromptBold', color: '#2563eb' }}>
                            {targetPosition}
                        </Text>
                        <Text style={{ fontSize: 10, fontFamily: 'PromptBold', color: '#475569', marginTop: 2 }}>
                            ประสบการณ์ทำงานรวม: {expDisplay}
                        </Text>
                    </View>

                    <View style={{ backgroundColor: '#eff6ff', padding: 10, borderRadius: 6, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#1e3a8a' }}>
                        <Text style={{ fontSize: 9, color: '#1e3a8a', fontFamily: 'PromptBold', marginBottom: 2 }}>เงินเดือนที่คาดหวัง (EXPECTED SALARY)</Text>
                        <Text style={{ fontSize: 15, fontFamily: 'PromptBold', color: '#1e40af' }}>
                            {data.expectedSalaryText || (profile.expectedSalary ? `${Number(profile.expectedSalary).toLocaleString()} บาท` : 'ตามตกลง')}
                        </Text>
                    </View>

                    <View wrap={false}>
                        <Text style={styles.mainSectionTitle}>ประสบการณ์ทำงาน (WORK EXPERIENCE)</Text>
                        {(data.workHistory || data.workHistories)?.length > 0 ? (data.workHistory || data.workHistories).map((work: any, i: number) => (
                            <View key={i} style={styles.itemBlock}>
                                <Text style={styles.itemTitle}>{work.position}</Text>
                                <Text style={styles.itemSub}>{`${work.company} | ${work.startYear} - ${work.isCurrent ? 'ปัจจุบัน' : work.endYear}`}</Text>
                                <Text style={styles.itemDesc}>{`ประเภทธุรกิจ: ${work.businessType || '-'}`}</Text>
                            </View>
                        )) : <Text style={styles.itemDesc}>ไม่มีข้อมูล</Text>}
                    </View>

                    <View wrap={false}>
                        <Text style={styles.mainSectionTitle}>การศึกษา (EDUCATION)</Text>
                        {(data.educationHistory || data.educations)?.length > 0 ? (data.educationHistory || data.educations).map((edu: any, i: number) => (
                            <View key={i} style={styles.itemBlock}>
                                <Text style={styles.itemTitle}>
                                    {`${edu.educationLevel || ''}${edu.major || edu.faculty ? ` | ${edu.major || edu.faculty}` : ''}`}
                                </Text>
                                <Text style={styles.itemSub}>
                                    {edu.institution || edu.schoolName}
                                </Text>
                                <Text style={styles.itemDesc}>
                                    {`จบปีการศึกษา: ${edu.graduationYear || '-'} | เกรดเฉลี่ย (GPA): ${edu.gpa || '-'}`}
                                </Text>
                            </View>
                        )) : <Text style={styles.itemDesc}>ไม่มีข้อมูล</Text>}
                    </View>

                    <View wrap={false}>
                        <Text style={styles.mainSectionTitle}>ผลการทดสอบทางภาษา (LANGUAGE TESTS)</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                            {data.languageTests?.length > 0 ? data.languageTests.map((test: any, i: number) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.itemBlock,
                                        { width: '50%', marginBottom: 8 }
                                    ]}
                                >
                                    <Text style={styles.itemTitle}>{test.testName || 'ชื่อข้อสอบ'}</Text>
                                    <Text style={styles.itemSub}>{`คะแนน: ${test.score || '-'}`}</Text>
                                </View>
                            )) : (
                                <Text style={styles.itemDesc}>ไม่มีข้อมูล</Text>
                            )}
                        </View>
                    </View>

                    {/* --- ส่วนติดต่อ (CONTACT) --- */}
                    <View style={styles.footerContact}>
                        <Text style={styles.footerTitle}>ข้อมูลติดต่อ (CONTACT)</Text>
                        <View style={styles.singleLine} />

                        <View style={styles.contactInfoRow}>
                            <Text style={styles.contactLabel}>Email:</Text>
                            <Text style={styles.contactValue}>{data.email || '-'}</Text>
                        </View>

                        <View style={styles.contactInfoRow}>
                            <Text style={styles.contactLabel}>Tel:</Text>
                            <Text style={styles.contactValue}>{data.phone || '-'}</Text>
                            <Text style={styles.contactLabel}>Line:</Text>
                            <Text style={styles.contactValue}>{profile.lineId || '-'}</Text>
                        </View>

                        <View style={styles.contactInfoRow}>
                            <Text style={styles.contactLabel}>ที่อยู่:</Text>
                            <Text style={styles.contactValue}>{addressParts || '-'}</Text>
                        </View>
                    </View>
                </View>

            </Page>
        </Document>
    );
};