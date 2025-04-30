import { disciplineService } from '@/services/disciplines/discipline.service'
import groupService from '@/services/group/group.service'
import { UploadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import {
	Button,
	Checkbox,
	Form,
	Input,
	InputNumber,
	message,
	Segmented,
	Select,
	Splitter,
	Steps,
	Table,
	Upload,
} from 'antd'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { Group } from '../groups/Group'
import './StudyPlanWizard.css' // Подключаем стили для анимации

const { Step } = Steps

const StudyPlanWizard = () => {
	const [currentStep, setCurrentStep] = useState(0)
	const [fileId, setFileId] = useState<string | null>(null)
	const [fileUrl, setFileUrl] = useState<string | null>(null)
	const [parsedData, setParsedData] = useState([])
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [selectedSemester, setSelectedSemester] = useState<number>(1)
	const [studyPlanId, setStudyPlanId] = useState()
	const [studyMode, setStudyMode] = useState<boolean>(false)

	const uploadUrl = studyMode
		? 'http://localhost:4200/api/parser/file'
		: 'http://localhost:4200/api/parser/fileDistance'

	// ✅ Запрос дисциплин по `studyPlanId`
	const {
		data: disciplinesData = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['disciplines', studyPlanId],
		queryFn: () =>
			studyPlanId?.data?.id
				? disciplineService.getDisciplines('cm8q9b3y10003668gthnior9q')
				: [],
		enabled: !!studyPlanId, // ✅ Запрос выполняется только если `fileId` существует
	})

	const {
		data: groupsData,
		isGroupLoading,
		errorGroup,
	} = useQuery<Group[]>({
		queryKey: ['groups'],
		queryFn: () => groupService.getAll(),
	})

	// Фильтруем дисциплины по выбранному семестру
	const filteredDisciplines = disciplinesData.filter(
		discipline => discipline.semester === selectedSemester
	)

	// Обновляем `file` в `state` перед загрузкой
	const beforeUpload = (file: File) => {
		setSelectedFile(file)
		return false
	}

	const handleUpload = async () => {
		if (!selectedFile) {
			message.error('Выберите файл перед загрузкой!')
			return
		}

		const formData = new FormData()
		formData.append('file', selectedFile)

		try {
			const response = await axios.post(uploadUrl, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})

			console.log(response.data)

			message.success('Файл загружен!')
			setTimeout(() => {
				setFileId(response.data.file.id)
				setCurrentStep(1)
			}, 500) // ✅ Добавляем 1 сек задержку перед переходом на следующий шаг
			// setFileId(response.data.file.id);
			// setCurrentStep(1);
		} catch (error) {
			message.error('Ошибка загрузки файла')
		}
	}

	// 2️⃣ Получаем URL файла для `iframe`
	useEffect(() => {
		if (!fileId) return
		const fetchFileUrl = async () => {
			try {
				const response = await axios.get(
					`http://localhost:4200/api/parser/${fileId}`
				)
				setFileUrl(response.data.fileUrl)
			} catch (error) {
				message.error('Ошибка получения файла')
			}
		}
		fetchFileUrl()
	}, [fileId])

	// 3️⃣ Отправка данных на сервер для парсинга
	const handleParse = async (values: any) => {
		if (!fileId) return
		console.log(values)
		try {
			const response = await axios.post(
				`http://localhost:4200/api/parser/parse/${fileId}`,
				values
			)
			console.log('Ответ сервера:', response.data.data)

			setStudyPlanId(response?.data)
			message.success('Файл успешно обработан!')
			// setCurrentStep(2);
			setTimeout(() => {
				setCurrentStep(2)
			}, 500) // ✅ Добавляем 1 сек задержку перед переходом на следующий шаг
		} catch (error) {
			message.error('Ошибка обработки файла')
			console.error(error)
		}
	}

	const navigate = useNavigate() // ✅ Создаём навигатор

	const resetAndStartNew = () => {
		setFileId(null)
		setFileUrl(null)
		setParsedData([])
		setSelectedFile(null)
		setCurrentStep(0) // ✅ Сбрасываем всё и начинаем заново
	}

	const goToConstructor = () => {
		navigate('/constructor') // ✅ Переход на страницу конструктора
	}

	return (
		<div>
			<Steps current={currentStep} className='mb-4'>
				<Step title='Загрузка файла' />
				<Step title='Настройка' />
				<Step title='Просмотр результата' />
			</Steps>

			{/* 🔹 Плавный переход между шагами */}
			<TransitionGroup>
				<CSSTransition key={currentStep} classNames='fade' timeout={500}>
					<div>
						{/* 🔹 Шаг 1: Загрузка файла */}
						{currentStep === 0 && (
							<div className='mt-20 flex flex-col justify-center items-center gap-4'>
								<Checkbox
									checked={studyMode}
									onChange={e => setStudyMode(e.target.checked)}
								>
									Расширенный
								</Checkbox>

								<Upload
									beforeUpload={beforeUpload}
									accept='.xlsx,.xls'
									showUploadList={false}
								>
									<Button icon={<UploadOutlined />}>
										Выбрать учебный план
									</Button>
								</Upload>
								<Button
									type='primary'
									onClick={handleUpload}
									disabled={!selectedFile}
								>
									Загрузить файл
								</Button>
							</div>
						)}

						{/* 🔹 Шаг 2: Настройка парсинга */}
						{currentStep === 1 && (
							<>
								<Splitter>
									<Splitter.Panel
										defaultSize='20%'
										min='20%'
										max='70%'
										className='mr-4'
									>
										<Form layout='vertical' onFinish={handleParse}>
											<Form.Item
												name='title'
												label='Название учебного плана'
												rules={[{ required: true }]}
											>
												<Input placeholder='Введите название' />
											</Form.Item>
											{[1, 2, 3, 4].map(num => (
												<div key={num}>
													<Form.Item
														name={`start_${num}`}
														label={`Начало ${num} семестра`}
														rules={[{ required: true }]}
													>
														<InputNumber style={{ width: '100%' }} />
													</Form.Item>
													<Form.Item
														name={`end_${num}`}
														label={`Конец ${num} семестра`}
														rules={[{ required: true }]}
													>
														<InputNumber style={{ width: '100%' }} />
													</Form.Item>
												</div>
											))}
											<Form.Item
												name='groups'
												label='Группы'
												rules={[
													{
														required: true,
														message: 'Выберите хотя бы одну группу',
													},
												]}
											>
												<Select
													mode='multiple'
													placeholder='Выберите группы'
													loading={isGroupLoading}
												>
													{groupsData?.map(group => (
														<Select.Option key={group.id} value={group.id}>
															{group.title}
														</Select.Option>
													))}
												</Select>
											</Form.Item>
											<Button type='primary' htmlType='submit'>
												Отправить на обработку
											</Button>
										</Form>
									</Splitter.Panel>

									<Splitter.Panel className='ml-4'>
										<h3>Загруженный файл</h3>
										<iframe
											src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
												fakeFileUrl
											)}`}
											width='100%'
											height='500px'
										/>
									</Splitter.Panel>
								</Splitter>
							</>
						)}

						{/* 🔹 Шаг 3: Просмотр результата */}
						{currentStep === 2 && (
							<Splitter>
								<Splitter.Panel
									defaultSize='50%'
									min='30%'
									max='70%'
									className='mr-4'
								>
									<div className='flex flex-col'>
										<div
											style={{
												// marginTop: '20px',
												display: 'flex',
												gap: '10px',
											}}
										>
											<Button type='default' onClick={resetAndStartNew}>
												Создать новый учебный план
											</Button>
											<Button type='primary' onClick={goToConstructor}>
												Перейти в конструктор
											</Button>
										</div>
										<Segmented
											options={[1, 2, 3, 4, 5, 6, 7, 8].map(num => ({
												label: `Семестр ${num}`,
												value: num,
											}))}
											value={selectedSemester}
											onChange={value => setSelectedSemester(value as number)}
											className='left-0 w-fit mb-4 mt-4'
										/>
										<Table
											dataSource={filteredDisciplines}
											columns={[
												{ title: 'Название', dataIndex: 'name', key: 'name' },
												{
													title: 'Лек',
													dataIndex: 'lecture_hours',
													key: 'lecture_hours',
												},
												{
													title: 'Лек электр',
													dataIndex: 'el_lecture_hours',
													key: 'el_lecture_hours',
												},
												{
													title: 'Лаб',
													dataIndex: 'laboratory_hours',
													key: 'laboratory_hours',
												},
												{
													title: 'Лаб электр',
													dataIndex: 'el_lecture_hours',
													key: 'el_lecture_hours',
												},
												{
													title: 'Пр',
													dataIndex: 'practice_hours',
													key: 'practice_hours',
												},
												{
													title: 'Пр электр',
													dataIndex: 'el_practice_hours',
													key: 'el_practice_hours',
												},
												{
													title: 'Контроль',
													dataIndex: 'control',
													key: 'control',
												},
											]}
											pagination={false}
											rowKey='id'
											loading={isLoading}
										/>

										{/* <div
											style={{
												marginTop: '20px',
												display: 'flex',
												gap: '10px',
											}}
										>
											<Button type='default' onClick={resetAndStartNew}>
												Создать новый учебный план
											</Button>
											<Button type='primary' onClick={goToConstructor}>
												Перейти в конструктор
											</Button>
										</div> */}
									</div>
								</Splitter.Panel>
								<Splitter.Panel className='ml-4'>
									<div>
										<iframe
											src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
												fakeFileUrl
											)}`}
											width='100%'
											height='900px'
											style={{ border: '1px solid #ddd' }}
										/>
									</div>
								</Splitter.Panel>
							</Splitter>
						)}
					</div>
				</CSSTransition>
			</TransitionGroup>
		</div>
	)
}

export default StudyPlanWizard
